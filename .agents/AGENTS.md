# AGENTS.md - LokTik Project Guidelines & Rules

## Token Efficiency Rules
1. **Targeted Reading:** Always read specific line ranges in files instead of reading large 800-line files.
2. **Concise Indonesian Communication:** Provide direct, clean responses with markdown summaries.
3. **Strict Code Limits:** Maintain React files under 220 lines.
4. **Authoritative Context First:** Consult `agent.md`, `README.md`, and `design.md` for schemas and architecture.

## Core Project Capabilities
- **1-Click Launch Script:** Run `START_LOKTIK.bat` to launch Vite frontend + WA Bot server + browser.
- **Multi-Tenant EO Data Isolation:** EO stats and events are isolated by `created_by` username.
- **Cantik 4-Digit Redeem Codes (`RB1029`):** Built with 2 event initials + 4 digits for rapid venue gate scanning.
- **Streetwear Dark UI:** Uses custom React dropdowns, hidden scrollbars (`.no-scrollbar`), and neon accents.

## Strict Design & Anti-AI Slop Rules (ABSOLUTE MANDATE)
1. **STRICT ZERO EMOJIS IN UI & CODE:** NEVER use any emojis in UI text, button labels, ticker banners, headings, toasts, or copy (no 🗺️, 🔥, ⚡, 🛡️, 💜, 🎸, 🎨, 🎤, etc.). Use ONLY clean SVG icons (Lucide-react) or plain text.
2. **NO TEXT GRADIENTS & NO GLASSMORPHISM:** Never use rainbow text gradients (`bg-clip-text text-transparent`) or cheesy backdrop blur glow spheres. Use solid contrast colors with sharp streetwear editorial typography on dark backgrounds (`#0a0a0a` / `#121212`).
3. **STANDARD GOOGLE TYPOGRAPHY:** Use standard, clean fonts (**Montserrat**, **Poppins**, **Bebas Neue**). Avoid Space Grotesk or weird/funky AI slop fonts.
4. **UNIFORM 4:5 VERTICAL POSTER RATIO:** All event posters in catalog list and detail pages must strictly use the vertical **4:5 aspect ratio (`aspect-[4/5]`)**.
5. **STRICT ROLE-BASED COLOR HIERARCHY:**
   - **Public / General Buyer Pages (`/`, `/event/*`, `/checkout`):** DOMINANT CYBER BLUE (`#06B6D4` / `brand-blue`).
   - **EO & Admin Dashboard Pages (`/eo/dashboard`, `/admin/dashboard`):** DOMINANT NEON GREEN (`#39FF14` / `brand-green`).
   - **Staff Scanning & Gate Pages (`/gate/*`):** DOMINANT ELECTRIC PURPLE (`#8B5CF6` / `brand-purple`).
6. **STRICT SUPABASE ONLY FOR DATABASE:** NEVER use `localStorage` or `sessionStorage` as a pseudo-database for storing stateful records like accounts, orders, or events. Always use Supabase for any CRUD operations to ensure cross-device synchronization and real-world persistence.
7. **STRICT GLOBAL STATUS TAXONOMY (LOCKED STANDARDIZATION):**
   - **Payment Statuses:** Use strictly `PAID`, `PENDING`, `REUPLOAD` across UI, PDF reports, and Excel exports. NEVER use `LUNAS` or `DITOLAK`.
   - **Ticket Scan Statuses:** Use strictly `ACTIVE` (unscanned) and `SCANNED` (scanned). NEVER mix `BELUM SCAN` or `SUDAH DIGUNAKAN`.
   - **Order Types:** Use strictly `PO` (online) and `OTS` (`OTS (QRIS)` / `OTS (CASH)`).
   - **WA Bot Statuses:** Use strictly `BOT ONLINE` and `BOT OFFLINE` (NEVER `BOT STANDBY` or `CONNECTED`).
   - **Staff Account Statuses:** Use strictly `ACTIVE` and `SUSPENDED`.
   - **Event Statuses:** Use strictly `LIVE` and `EXPIRED`.
   - **Ticket Stock Statuses:** Use strictly `AVAILABLE` and `SOLD OUT`.

