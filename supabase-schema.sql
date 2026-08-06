-- ====================================================================
-- LOKTIK DATABASE SCHEMA (SUPABASE POSTGRESQL FREE TIER)
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Events Table (Managed by EO)
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    eo_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    poster_url TEXT,
    event_date TIMESTAMPTZ NOT NULL,
    open_gate TIMESTAMPTZ NOT NULL,
    payment_details JSONB NOT NULL DEFAULT '{}'::jsonb, -- e.g. {"bank": "BCA", "number": "12345678", "holder": "Panitia"}
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'draft', 'active', 'ended'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Ticket Categories / Tiers Table
CREATE TABLE IF NOT EXISTS public.ticket_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    quota INT DEFAULT NULL, -- NULL means UNLIMITED (ideal for Merch PO / Open tier)
    description TEXT,
    start_po TIMESTAMPTZ,
    end_po TIMESTAMPTZ,
    is_ots_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    price_ots DECIMAL(12, 2) DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Orders Table (Guest Purchase Records)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    guest_name VARCHAR(100) NOT NULL,
    guest_wa VARCHAR(30) NOT NULL,
    guest_ig VARCHAR(50),
    total_price DECIMAL(12, 2) NOT NULL,
    payment_proof_url TEXT,
    payment_method VARCHAR(50), -- 'Transfer Bank', 'QRIS', 'CASH'
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'need_reupload', 'paid', 'cancelled'
    is_ots BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Individual Ticket Units Table (One per physical ticket)
CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    ticket_category_id UUID NOT NULL REFERENCES public.ticket_categories(id) ON DELETE RESTRICT,
    barcode_uuid UUID NOT NULL DEFAULT uuid_generate_v4() UNIQUE,
    is_scanned BOOLEAN NOT NULL DEFAULT FALSE,
    scanned_at TIMESTAMPTZ,
    scanned_by VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_events_slug ON public.events(slug);
CREATE INDEX IF NOT EXISTS idx_events_eo_id ON public.events(eo_id);
CREATE INDEX IF NOT EXISTS idx_ticket_cat_event ON public.ticket_categories(event_id);
CREATE INDEX IF NOT EXISTS idx_orders_event ON public.orders(event_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_tickets_order ON public.tickets(order_id);
CREATE INDEX IF NOT EXISTS idx_tickets_barcode ON public.tickets(barcode_uuid);

-- ====================================================================
-- ATOMIC DATABASE FUNCTIONS (Race Condition Protection)
-- ====================================================================

-- Atomic Ticket Scanning (Wristband Rule: Once scanned, permanent locked)
CREATE OR REPLACE FUNCTION public.scan_ticket_atomic(
    target_barcode UUID,
    gate_staff_name VARCHAR(100)
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    ticket_id UUID,
    guest_name VARCHAR(100),
    category_name VARCHAR(100)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_ticket RECORD;
BEGIN
    -- Select ticket & lock row
    SELECT t.id, t.is_scanned, o.guest_name, tc.name AS cat_name
    INTO v_ticket
    FROM public.tickets t
    JOIN public.orders o ON t.order_id = o.id
    JOIN public.ticket_categories tc ON t.ticket_category_id = tc.id
    WHERE t.barcode_uuid = target_barcode
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'TIKET TDK DITEMUKAN / INVALID'::TEXT, NULL::UUID, NULL::VARCHAR, NULL::VARCHAR;
        RETURN;
    END IF;

    IF v_ticket.is_scanned THEN
        RETURN QUERY SELECT FALSE, 'TIKET SUDAH DIPAKAI (HANGUS)'::TEXT, v_ticket.id, v_ticket.guest_name, v_ticket.cat_name;
        RETURN;
    END IF;

    -- Update scan status atomically
    UPDATE public.tickets
    SET is_scanned = TRUE,
        scanned_at = NOW(),
        scanned_by = gate_staff_name
    WHERE barcode_uuid = target_barcode;

    RETURN QUERY SELECT TRUE, 'TIKET VALID - GANTI GELANG!'::TEXT, v_ticket.id, v_ticket.guest_name, v_ticket.cat_name;
END;
$$;

-- Atomic Quota Deduction for Checkout / OTS Purchase
CREATE OR REPLACE FUNCTION public.deduct_quota_atomic(
    target_category_id UUID,
    qty_requested INT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_quota INT;
    v_end_po TIMESTAMPTZ;
BEGIN
    SELECT quota, end_po INTO v_quota, v_end_po
    FROM public.ticket_categories
    WHERE id = target_category_id
    FOR UPDATE;

    -- Validasi Expired
    IF v_end_po IS NOT NULL AND NOW() > v_end_po THEN
        RAISE EXCEPTION 'Waktu pembelian tiket sudah berakhir (Expired).';
    END IF;

    -- If quota is NULL, it is UNLIMITED (PO mode)
    IF v_quota IS NULL THEN
        RETURN TRUE;
    END IF;

    IF v_quota >= qty_requested THEN
        UPDATE public.ticket_categories
        SET quota = quota - qty_requested
        WHERE id = target_category_id;
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$;

-- ====================================================================
-- EO PROFILES & SUBSCRIPTION ENTITLEMENTS TABLE
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.eo_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    eo_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    eo_username VARCHAR(100) NOT NULL UNIQUE,
    tier_code VARCHAR(50) NOT NULL DEFAULT 'starter', -- 'starter', 'pro', 'enterprise'
    max_active_events INTEGER NOT NULL DEFAULT 1,
    max_staff_accounts INTEGER NOT NULL DEFAULT 2,
    allow_event_pass BOOLEAN NOT NULL DEFAULT FALSE,
    allow_custom_domain BOOLEAN NOT NULL DEFAULT FALSE,
    wa_quota INTEGER NOT NULL DEFAULT 0,
    wa_messages_sent INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'SUSPENDED'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eo_profiles_eo_id ON public.eo_profiles(eo_id);
CREATE INDEX IF NOT EXISTS idx_eo_profiles_username ON public.eo_profiles(eo_username);
CREATE INDEX IF NOT EXISTS idx_eo_profiles_tier ON public.eo_profiles(tier_code);

-- ====================================================================
-- ATOMIC FUNCTION: Top Up WA Quota for EO
-- ====================================================================
CREATE OR REPLACE FUNCTION public.top_up_wa_quota(
    target_eo_id UUID,
    quota_amount INT
)
RETURNS TABLE (
    success BOOLEAN,
    new_quota INTEGER,
    message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_exists BOOLEAN;
BEGIN
    SELECT EXISTS(SELECT 1 FROM public.eo_profiles WHERE eo_id = target_eo_id) INTO v_exists;

    IF NOT v_exists THEN
        INSERT INTO public.eo_profiles (eo_id, eo_username, wa_quota, wa_messages_sent)
        VALUES (target_eo_id, 'unknown_' || target_eo_id::TEXT, quota_amount, 0);
    ELSE
        UPDATE public.eo_profiles
        SET wa_quota = wa_quota + quota_amount,
            updated_at = NOW()
        WHERE eo_id = target_eo_id;
    END IF;

    SELECT wa_quota INTO new_quota FROM public.eo_profiles WHERE eo_id = target_eo_id;

    RETURN QUERY SELECT TRUE, new_quota, 'Kuota WA berhasil ditambahkan sebesar ' || quota_amount::TEXT || ' pesan.'::TEXT;
END;
$$;

-- ====================================================================
-- ATOMIC FUNCTION: Deduct WA Quota (called when bot sends message)
-- ====================================================================
CREATE OR REPLACE FUNCTION public.deduct_wa_quota(
    target_eo_id UUID,
    messages_count INT DEFAULT 1
)
RETURNS TABLE (
    success BOOLEAN,
    remaining_quota INTEGER,
    total_sent INTEGER,
    message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_quota INT;
    v_current_sent INT;
BEGIN
    SELECT wa_quota, wa_messages_sent INTO v_current_quota, v_current_sent
    FROM public.eo_profiles
    WHERE eo_id = target_eo_id
    FOR UPDATE;

    IF NOT FOUND OR v_current_quota < messages_count THEN
        RETURN QUERY SELECT FALSE, COALESCE(v_current_quota, 0), COALESCE(v_current_sent, 0), 'KUOTA WA TIDAK CUKUP ATAU EO TIDAK DITEMUKAN'::TEXT;
        RETURN;
    END IF;

    UPDATE public.eo_profiles
    SET wa_quota = wa_quota - messages_count,
        wa_messages_sent = wa_messages_sent + messages_count,
        updated_at = NOW()
    WHERE eo_id = target_eo_id;

    SELECT wa_quota, wa_messages_sent INTO remaining_quota, total_sent
    FROM public.eo_profiles WHERE eo_id = target_eo_id;

    RETURN QUERY SELECT TRUE, remaining_quota, total_sent, 'Pesan terkirim, kuota terpotong.'::TEXT;
END;
$$;

-- ====================================================================
-- ATOMIC FUNCTION: Get EO Entitlements & Active Usage
-- ====================================================================
CREATE OR REPLACE FUNCTION public.get_eo_entitlements(
    target_eo_id UUID
)
RETURNS TABLE (
    eo_id UUID,
    eo_username VARCHAR(100),
    tier_code VARCHAR(50),
    max_active_events INT,
    current_active_events INT,
    max_staff_accounts INT,
    current_staff_accounts INT,
    allow_event_pass BOOLEAN,
    allow_custom_domain BOOLEAN,
    wa_quota INT,
    wa_messages_sent INT,
    status VARCHAR(20)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_prof RECORD;
    v_active_events INT := 0;
    v_active_staff INT := 0;
BEGIN
    SELECT * INTO v_prof FROM public.eo_profiles WHERE public.eo_profiles.eo_id = target_eo_id;

    IF NOT FOUND THEN
        -- Fallback default if profile not yet seeded
        RETURN QUERY SELECT 
            target_eo_id, 
            'eo_user'::VARCHAR(100), 
            'starter'::VARCHAR(50), 
            1, 0, 2, 0, 
            FALSE, FALSE, 0, 0, 
            'ACTIVE'::VARCHAR(20);
        RETURN;
    END IF;

    -- Count active events for this EO
    SELECT COUNT(*)::INT INTO v_active_events
    FROM public.events e
    WHERE e.eo_id = target_eo_id AND e.status = 'active';

    -- Count active staff accounts for this EO
    SELECT COUNT(*)::INT INTO v_active_staff
    FROM public.staff_accounts s
    WHERE s.eo_username = v_prof.eo_username AND s.status = 'ACTIVE';

    RETURN QUERY SELECT 
        v_prof.eo_id,
        v_prof.eo_username,
        v_prof.tier_code,
        v_prof.max_active_events,
        v_active_events,
        v_prof.max_staff_accounts,
        v_active_staff,
        v_prof.allow_event_pass,
        v_prof.allow_custom_domain,
        v_prof.wa_quota,
        v_prof.wa_messages_sent,
        v_prof.status;
END;
$$;

-- ====================================================================
-- ATOMIC FUNCTION: Validate EO Action Authorization
-- ====================================================================
CREATE OR REPLACE FUNCTION public.validate_eo_action(
    target_eo_id UUID,
    action_type VARCHAR(50)
)
RETURNS TABLE (
    allowed BOOLEAN,
    message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_ent RECORD;
BEGIN
    SELECT * INTO v_ent FROM public.get_eo_entitlements(target_eo_id);

    IF v_ent.status <> 'ACTIVE' THEN
        RETURN QUERY SELECT FALSE, 'AKUN EO SUSPENDED/TIDAK AKTIF'::TEXT;
        RETURN;
    END IF;

    IF action_type = 'CREATE_EVENT' THEN
        IF v_ent.current_active_events >= v_ent.max_active_events THEN
            RETURN QUERY SELECT FALSE, ('KUOTA EVENT HABIIS. MAKSIMAL ' || v_ent.max_active_events || ' EVENT AKTIF UNTUK PAKET ' || UPPER(v_ent.tier_code))::TEXT;
            RETURN;
        END IF;
    ELSIF action_type = 'ADD_STAFF' THEN
        IF v_ent.current_staff_accounts >= v_ent.max_staff_accounts THEN
            RETURN QUERY SELECT FALSE, ('BATAS MAKSIMAL AKUN STAF (' || v_ent.max_staff_accounts || ' STAF) SUDAH TERPAKAII UNTUK PAKET ' || UPPER(v_ent.tier_code))::TEXT;
            RETURN;
        END IF;
    ELSIF action_type = 'SEND_WA' THEN
        IF v_ent.wa_quota <= 0 THEN
            RETURN QUERY SELECT FALSE, 'KUOTA BOT WA HABIS. SILAKAN TOP-UP PAKET WA BOT'::TEXT;
            RETURN;
        END IF;
    ELSIF action_type = 'USE_EVENT_PASS' THEN
        IF NOT v_ent.allow_event_pass THEN
            RETURN QUERY SELECT FALSE, 'FITUR EVENT PASS MEMBUTUHKAN PAKET PRO ATAU ENTERPRISE'::TEXT;
            RETURN;
        END IF;
    END IF;

    RETURN QUERY SELECT TRUE, 'IZIN DISETUJUI'::TEXT;
END;
$$;

-- ====================================================================
-- ATOMIC FUNCTION: Update EO Package Tier
-- ====================================================================
CREATE OR REPLACE FUNCTION public.update_eo_package(
    target_eo_id UUID,
    new_tier VARCHAR(50),
    add_wa_quota INT DEFAULT 0
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_max_events INT := 1;
    v_max_staff INT := 2;
    v_event_pass BOOLEAN := FALSE;
    v_custom_domain BOOLEAN := FALSE;
BEGIN
    IF LOWER(new_tier) = 'pro' THEN
        v_max_events := 5;
        v_max_staff := 10;
        v_event_pass := TRUE;
        v_custom_domain := FALSE;
    ELSIF LOWER(new_tier) = 'enterprise' THEN
        v_max_events := 99;
        v_max_staff := 99;
        v_event_pass := TRUE;
        v_custom_domain := TRUE;
    ELSE
        -- Default starter
        v_max_events := 1;
        v_max_staff := 2;
        v_event_pass := FALSE;
        v_custom_domain := FALSE;
    END IF;

    UPDATE public.eo_profiles
    SET tier_code = LOWER(new_tier),
        max_active_events = v_max_events,
        max_staff_accounts = v_max_staff,
        allow_event_pass = v_event_pass,
        allow_custom_domain = v_custom_domain,
        wa_quota = wa_quota + add_wa_quota,
        updated_at = NOW()
    WHERE eo_id = target_eo_id;

    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'PROFIL EO TIDAK DITEMUKAN'::TEXT;
        RETURN;
    END IF;

    RETURN QUERY SELECT TRUE, ('PAKET EO BERHASIL DIUPDATE KE ' || UPPER(new_tier))::TEXT;
END;
$$;

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eo_profiles ENABLE ROW LEVEL SECURITY;

-- 1. Events Policies
CREATE POLICY "Public events are viewable by anyone" 
    ON public.events FOR SELECT USING (status = 'active');

CREATE POLICY "EO can manage own events" 
    ON public.events FOR ALL USING (auth.uid() = eo_id);

-- 2. Ticket Categories Policies
CREATE POLICY "Public ticket categories viewable by anyone" 
    ON public.ticket_categories FOR SELECT USING (TRUE);

CREATE POLICY "EO can manage categories for own events" 
    ON public.ticket_categories FOR ALL USING (
        EXISTS (SELECT 1 FROM public.events WHERE id = ticket_categories.event_id AND eo_id = auth.uid())
    );

-- 3. Orders Policies
CREATE POLICY "Guests can create orders" 
    ON public.orders FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Guests can view order status with ID" 
    ON public.orders FOR SELECT USING (TRUE);

CREATE POLICY "EO can view and update orders for their events" 
    ON public.orders FOR ALL USING (
        EXISTS (SELECT 1 FROM public.events WHERE id = orders.event_id AND eo_id = auth.uid())
    );

-- 4. Tickets Policies
CREATE POLICY "Anyone can view ticket by barcode" 
    ON public.tickets FOR SELECT USING (TRUE);

CREATE POLICY "EO and Gate staff can scan/update tickets" 
    ON public.tickets FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            JOIN public.events e ON o.event_id = e.id
            WHERE o.id = tickets.order_id AND e.eo_id = auth.uid()
        )
    );

-- 5. EO Profiles Policies (WA Quota Management)
CREATE POLICY "EO can view own profile and WA quota"
    ON public.eo_profiles FOR SELECT USING (auth.uid() = eo_id);

CREATE POLICY "Admin or service role can manage EO profiles WA quota"
    ON public.eo_profiles FOR ALL USING (
        auth.role() = 'service_role' OR
        auth.jwt() ->> 'email' = 'admin@loktik.id'
    )
    WITH CHECK (
        auth.role() = 'service_role' OR
        auth.jwt() ->> 'email' = 'admin@loktik.id'
    );
