# Project Assumptions (ASSUMPTIONS.md)

1. **Primary Language and Direction**:
   - The primary institutional operating language of École Hebr is **Arabic (العربية)** rendered with full Right-to-Left (RTL) alignment and Prestige Académique typography (`Cormorant Garamond` / `Amiri` serif headings + `Lato` / `Tajawal` sans-serif body).
   - French translations and technical terms (RAN09, CDI, Cahier de texte, Art. 23, Art. 38) are preserved identically to the web app.

2. **Backend Integrity**:
   - The Node.js Express + MongoDB backend runs locally on port 5055 with PM2 (`zitouni-backend`).
   - CORS is configured to accept origins: `http://localhost:8081`, `http://localhost:8082`, `http://127.0.0.1:8081`, `http://localhost:5175`, and local network subnets (`192.168.*`, `10.*`).
   - All REST API routes (`/api/auth/*`, `/api/posts/*`, `/api/admin/*`, `/api/attendance/*`, `/api/lessons/*`, `/api/backups/*`, `/api/messages/*`, `/api/administrative-requests/*`) remain backward-compatible with 0 destructive changes.

3. **Role-Based Adaptation**:
   - When a user logs in with role `admin` or `school`, they access the comprehensive 21-module Administration Drawer and Dashboard.
   - Other roles (Teacher, Supervisor, Receptionist, Student, Parent) receive their tailored dashboard views while maintaining access to the central Academic News Feed, direct/group messaging, and account profile settings.

4. **Visual Parity Baseline**:
   - Reference viewport is standard mobile dimensions: 390x844 (iPhone 12/13/14/15 standard).
   - Color tokens in `tokens.ts` are exact 1:1 hex matches with `frontend/src/index.css`.
