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
BEGIN
    SELECT quota INTO v_quota
    FROM public.ticket_categories
    WHERE id = target_category_id
    FOR UPDATE;

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
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

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
