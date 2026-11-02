# Exhaustive Feature & Visual Parity Matrix (PARITY.md)

| Module / Screen | Web Element (`frontend/src/`) | Mobile Element (`mobile/`) | Backend API Endpoint | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Authentication** | `pages/Login.jsx` | `app/(auth)/login.tsx` | `POST /api/auth/login` | **100% PARITY** |
| | Phone/Email input with pure numeric support | `TextInput` with numeric keypad | - | **100% PARITY** |
| | Password visibility toggle | Eye/EyeOff toggle | - | **100% PARITY** |
| | Quick demo accounts chips for 8 roles | `TouchableOpacity` role chips | - | **100% PARITY** |
| | Institutional Branding (`مدرسة حبر`) | Vector Emblem `SchoolLogo.tsx` | - | **100% PARITY** |
| **Drawer Navigation** | `layouts/DashboardLayout.jsx` | `components/NavigationDrawer.tsx` | - | **100% PARITY** |
| | 21 Navigation routes matching web | 21 routes in `ADMIN_NAV_ITEMS` | - | **100% PARITY** |
| | Bordeaux active indicator pill | Right vertical pill `w-1` in `#7B1E3A` | - | **100% PARITY** |
| | Profile summary card (Initials + Name + Role) | Profile card with circle avatar | - | **100% PARITY** |
| | Red Logout button | `TouchableOpacity` with `LogOut` icon | `logout()` via store | **100% PARITY** |
| **Academic Feed** | `pages/FeedPage.jsx`, `components/Feed.jsx` | `app/(tabs)/index.tsx` (feed route) | `GET /api/posts` | **100% PARITY** |
| | « فضاء التواصل الأكاديمي » Cover Banner | Banner with Megaphone & « مباشر » badge | - | **100% PARITY** |
| | « نشر إعلان رسمي جديد » Action Button | Button opening `CreatePostModal` | `POST /api/posts` | **100% PARITY** |
| | Pinned Announcement Golden Banner | `pinnedBanner` with Pin icon & Gold border | `PUT /api/posts/:id/pin` | **100% PARITY** |
| | Post Likes counter & instant toggle | Heart icon with optimistic count | `POST /api/posts/:id/like` | **100% PARITY** |
| | Comment thread & submit form | Expandable comment section + Send input | `POST /api/posts/:id/comment` | **100% PARITY** |
| | Admin Post Edit & Delete tools | Edit3 & Trash2 buttons with confirmation | `PUT /api/posts/:id`, `DELETE` | **100% PARITY** |
| **Admin Overview** | `pages/AdminDashboard.jsx` (overview) | `app/(tabs)/index.tsx` (overview route) | `GET /api/admin/dashboard/stats` | **100% PARITY** |
| | 3 Quick Access Banners | 3 Cards (Security, Inscriptions, Reports) | - | **100% PARITY** |
| | 5 Daily Operational KPIs (Absence, Lates, etc.) | 5 Cards with matching color borders | - | **100% PARITY** |
| | 4 Global Statistics (Students, Teachers, etc.) | 4 Counters (454, 10, 41, 609k DZD) | - | **100% PARITY** |
| | Recent Financial Transactions Table | Transaction list with status badges | `POST /api/admin/payments` | **100% PARITY** |
| | « إنشاء فاتورة جديدة » Button | Modal with student, amount, type, status | `POST /api/admin/payments` | **100% PARITY** |
| **Users Management** | `pages/AdminDashboard.jsx` (users) | `app/(tabs)/index.tsx` (users route) | `GET /api/admin/users` | **100% PARITY** |
| | User search bar (Name, Email, Phone) | Live filtering `TextInput` | - | **100% PARITY** |
| | Role filter pills (All, Teacher, Student, etc.) | Horizontal scrollable chips | - | **100% PARITY** |
| | « إضافة مستخدم جديد » Button & Form | Modal with full validation | `POST /api/admin/users` | **100% PARITY** |
| | Account Activation / Freeze toggle switch | One-click button (`مفعل` / `مجمد`) | `PUT /api/admin/users/:id/toggle` | **100% PARITY** |
| | Permanent Account Deletion button | Trash button with confirmation alert | `DELETE /api/admin/users/:id` | **100% PARITY** |
| **Teachers Directory** | `pages/AdminDashboard.jsx` (teachers) | `app/(tabs)/index.tsx` (teachers route) | `GET /api/admin/teachers` | **100% PARITY** |
| | Teachers list with Article 23 qualifications | Card list with contract & assigned hours | - | **100% PARITY** |
| **Students Directory** | `pages/AdminDashboard.jsx` (students) | `app/(tabs)/students.tsx` & (students route)| `GET /api/admin/students` | **100% PARITY** |
| | 454 Enrolled Students directory | FlatList with pagination & search | - | **100% PARITY** |
| | Tuition payment status & exit pass badges | Color-coded badges (`مسدد`, `مصرّح`) | - | **100% PARITY** |
| **Classes & Groups** | `pages/AdminDashboard.jsx` (classes) | `app/(tabs)/index.tsx` (classes route) | `GET /api/admin/classes` | **100% PARITY** |
| | 41 Classes & 48 Groups cards | Grid cards with educational level | - | **100% PARITY** |
| | « إنشاء قسم جديد » Button & Form | Modal with class name and level | `POST /api/admin/classes` | **100% PARITY** |
| **Attendance** | `pages/AdminDashboard.jsx` (attendance) | `app/(tabs)/index.tsx` (attendance route) | `GET /api/attendance/stats/today` | **100% PARITY** |
| | Attendance rates, daily absences, warnings | KPI counters & status overview | - | **100% PARITY** |
| **Timetable (RAN09)** | `pages/AdminDashboard.jsx` (timetable) | `app/(tabs)/index.tsx` (timetable route) | `GET /api/admin/schedules` | **100% PARITY** |
| | Weekly schedules per class (Sun-Thu) | Class schedule cards with RAN09 badge | - | **100% PARITY** |
| **Cahier de texte** | `pages/AdminDashboard.jsx` (lessons) | `app/(tabs)/index.tsx` (lessons route) | `GET /api/lessons` | **100% PARITY** |
| | 171 Lessons with homework & teacher visas | Card list with period and summary | - | **100% PARITY** |
| **Finance & Payroll** | `pages/AdminDashboard.jsx` (finance) | `app/(tabs)/index.tsx` (finance route) | `GET /api/admin/dashboard/stats` | **100% PARITY** |
| | Total revenue, breakdown, invoice creator | Revenue KPI + New invoice modal | `POST /api/admin/payments` | **100% PARITY** |
| **Modules (Subjects)**| `pages/AdminDashboard.jsx` (modules) | `app/(tabs)/index.tsx` (modules route) | `GET /api/admin/modules` | **100% PARITY** |
| | 14 Academic modules & coefficients | Module cards + Add modal + Delete | `POST/DELETE /api/admin/modules` | **100% PARITY** |
| **Admin Documents** | `pages/AdminDashboard.jsx` (documents) | `app/(tabs)/index.tsx` (documents route) | `GET /api/admin/documents` | **100% PARITY** |
| | Contracts and school regulations | Card list with category & ready badge | - | **100% PARITY** |
| **Schedules Directory**| `pages/AdminDashboard.jsx` (schedules) | `app/(tabs)/index.tsx` (schedules route) | `GET /api/admin/schedules` | **100% PARITY** |
| | Exam, Transport, and Canteen schedules | List with type badge and date details | - | **100% PARITY** |
| **Login & Security Audit**| `pages/AdminDashboard.jsx` (audit) | `app/(tabs)/index.tsx` (login-audit route)| `GET /api/admin/login-audit` | **100% PARITY** |
| | Security logs (IP, Device, SUCCESS/FAIL) | Live audit cards with status badges | - | **100% PARITY** |
| **Branding Settings** | `components/SchoolBrandingSettings.jsx` | `app/(tabs)/index.tsx` (branding route) | `GET /api/school-settings` | **100% PARITY** |
| | Emblem, school name, slogan, colors | Emblem preview, slogan, hex swatches | - | **100% PARITY** |
| **Backups & Security** | `components/DatabaseBackupManager.jsx` | `app/(tabs)/index.tsx` (backups route) | `GET /api/backups` | **100% PARITY** |
| | 6 AES-256-CBC Encrypted backups | Backup cards + « إنشاء نسخة الآن » | `POST /api/backups/create` | **100% PARITY** |
| **Administrative Requests**| `components/AdministrativeRequestsManager.jsx`| `app/(tabs)/index.tsx` (requests route)| `GET /api/administrative-requests` | **100% PARITY** |
| | 13 Requests (Certificates, leave, etc.) | Request cards + « قبول » / « رفض » | `PUT /api/administrative-requests/:id`| **100% PARITY** |
| **Reported Messages** | `components/ReportedMessagesManager.jsx` | `app/(tabs)/index.tsx` (reported route) | `GET /api/messages/reported` | **100% PARITY** |
| | Flagged messages moderation | Cards with sender, text, report reason | - | **100% PARITY** |
| **Chat & Messaging** | `pages/Chat.jsx` | `app/(tabs)/messages.tsx` | `GET /api/messages` | **100% PARITY** |
| | Direct and group channels | Conversation list with search & avatars | - | **100% PARITY** |
| **Profile & Settings** | `layouts/DashboardLayout.jsx` (modal) | `app/(tabs)/profile.tsx` | `PUT /api/auth/profile` | **100% PARITY** |
| | Avatar upload with camera & gallery | Native image picker + preview | `POST /api/auth/profile/avatar` | **100% PARITY** |
| | Avatar removal | Destructive photo remove button | `DELETE /api/auth/profile/avatar` | **100% PARITY** |
| | Edit profile (Names, Phone, Password) | Form with validation & instant feedback | `PUT /api/auth/profile` | **100% PARITY** |
| | Permanent Account Deletion (Apple 5.1.1v) | Red deletion button with confirmation | `DELETE /api/auth/account` | **100% PARITY** |
