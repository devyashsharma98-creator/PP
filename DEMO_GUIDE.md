# Pragya Pravah — Final Demo Guide (Step 10)

> Updated after login/logout implementation. All flows use the real `/login` page.
> No browser-console hacks needed.

---

## 1. Pre-Demo Checklist

Run through this **30 minutes before** the demo call.

### A. Environment Flags

Your `.env.local` MUST have these lines (add the missing ones):

```
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
NEXT_PUBLIC_ENABLE_DEMO_DATA_FALLBACK=false
NEXT_PUBLIC_ENABLE_DEMO_ROLE_SWITCH=true
```

Verify checklist:
- [ ] `NEXT_PUBLIC_SUPABASE_URL` is set and valid
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set and valid
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set (needed by bootstrap API for viewer context)
- [ ] `NEXT_PUBLIC_ENABLE_DEMO_DATA_FALLBACK=false` (we want real DB data, not hardcoded fallback)
- [ ] `NEXT_PUBLIC_ENABLE_DEMO_ROLE_SWITCH=true` (enables role dropdown in navbar for switching views)

### B. Dev Server

- [ ] Run `npm run dev` — terminal shows "Ready" with no red errors
- [ ] Open `http://localhost:3000` — landing page loads with mandala animation + typewriter

### C. Login Page Works

- [ ] Open `http://localhost:3000/login` — card with Flame icon, email/password fields, 4 demo-account pills visible
- [ ] Click "Vibhag Pramukh" pill → email fills to `demo.vibhag@example.com`, password fills to `Password123!`
- [ ] Click "Sign In" → spinner shows, then redirects to `/dashboard`
- [ ] Navbar shows role badge "Vibhag Pramukh" (or "विभाग प्रमुख" in Hindi mode)

### D. All 4 Demo Accounts Work

Logout (click LogOut icon in navbar) and test each:

| # | Click this pill | Expected role badge after login |
|---|---|---|
| 1 | Vibhag Pramukh | Vibhag Pramukh |
| 2 | Aayam Pramukh | Aayam Pramukh |
| 3 | Unit Head | Unit Head |
| 4 | Karyakarta | Karyakarta (Writer) |

- [ ] All 4 login successfully and show correct badge
- [ ] Logout button (LogOut icon, right side of navbar) works → returns to `/login`

### E. Seeded Data Visible

Login as `demo.vibhag@example.com` and verify:

- [ ] `/dashboard` — KPI cards show non-zero numbers (animated counters)
- [ ] `/dashboard` — At least 1 event in the Gatividhi list (look for "Yuva Sangam" or similar)
- [ ] `/dashboard` — At least 1 event with vritt data (attendance count, report text)
- [ ] `/aalekh` — At least 1 Draft and 1 Published article visible
- [ ] `/prachar` — At least 1 row visible with platform checkboxes
- [ ] `/vimarsh` — Topics load with expandable sections (Atma Bodh, Forces of Division, etc.)
- [ ] `/feed` — Published article cards appear

### F. No Empty Screens on Safe Routes

- [ ] `/` — Landing page (public) OR ERP Launchpad (after login)
- [ ] `/parichay` — Bhopal Vibhag hierarchy renders
- [ ] `/vimarsh` — ATMA BODH BINDU topic groups visible
- [ ] `/dashboard` — Events tab loads with data
- [ ] `/aalekh` — Article list loads
- [ ] `/prachar` — Prachar table loads
- [ ] `/feed` — Content cards load
- [ ] `/directory` — Sampark directory loads (login required)

### G. Browser Prep

- [ ] Use Chrome or Edge
- [ ] Keep DevTools **closed** during screen share
- [ ] Have these URLs bookmarked for quick navigation:
  - `http://localhost:3000/login`
  - `http://localhost:3000/dashboard`
  - `http://localhost:3000/vimarsh`
  - `http://localhost:3000/aalekh`
  - `http://localhost:3000/prachar`

---

## 2. Five-Minute Fast Demo Script

> **Pre-demo:** Login as `demo.vibhag@example.com` via `/login` page BEFORE starting the screen share. You should already be on `/dashboard` when the call begins.

### Step 1 — Login Page Flash (20 sec)

- Open a new incognito tab → `localhost:3000/login`
- Show the login card with Flame branding, demo account pills
- Say: *"Yeh hamara login page hai. Real Supabase authentication hai. Demo ke liye 4 role-wise accounts hain — ek click me fill ho jaata hai."*
- Don't actually login here — switch back to your already-logged-in tab

### Step 2 — Dashboard / Gatividhi (1.5 min)

- Show KPI cards with animated counters
- Click any event in the list → detail sheet opens
- Point to event checklist and vritt section
- Say: *"Dashboard pe real-time KPIs hain — Total Events, Pending Reviews, Published Articles. Har event ka planning checklist hai — designing, food, seating, sound, camera. Event ke baad vritt report submit hota hai — attendance, media, summary."*

### Step 3 — Aalekh (45 sec)

- Click sidebar: **Aalekh Likhna / आलेख लिखें**
- Show articles with different statuses (Draft, Pending Review, Published)
- Say: *"Aalekh me articles likhte hain. Draft se Published tak multi-tier review hai — Unit Head review, phir Aayam Pramukh review. Values checklist bhi hai — Rashtra Pratham, No Divisive Content."*

### Step 4 — Vimarsh (45 sec)

- Click sidebar: **Vimarsh / विमर्श**
- Expand 1-2 topic groups (Atma Bodh, Forces of Division)
- Show resource links
- Say: *"Vimarsh me 15+ discourse topics hain — ATMA BODH BINDU framework se. Har topic ke sath curated resources — articles, videos, books. Public page hai — koi bhi access kar sakta hai."*

### Step 5 — Prachar + Role Switch (1 min)

- Click sidebar: **Prachar / प्रचार आयाम**
- Show platform distribution table (WhatsApp, Facebook, Instagram, Telegram)
- Then in navbar, switch role to **Karyakarta** using dropdown
- Show how permissions change
- Switch back to **Vibhag Pramukh**
- Say: *"Prachar me har event ka social media distribution track hota hai — skip reason dena padta hai agar post nahi kiya. Role switch dekho — Karyakarta ko limited access milta hai, Vibhag Pramukh ko full oversight."*

---

## 3. Ten-Minute Full Demo Script

### Act 1 — Login + Landing (1.5 min)

**Start: Not logged in. Open `localhost:3000`.**

| Time | What to do | What to say |
|------|-----------|-------------|
| 0:00 | Show landing page — let mandala animation play, scroll to aayam cards | *"Yeh Pragya Pravah ka public face hai. 5 aayams dikhte hain — Yuva, Mahila, Shodh, Prachar, Vimarsh. Mission statement, vision — sab yahan."* |
| 0:30 | Click sidebar **Vimarsh / विमर्श** — expand 2 topics, show resource links | *"Vimarsh — Pragya Pravah ka intellectual core. 15 discourse topics, curated study resources. Public page — koi bhi padh sakta hai."* |
| 1:00 | Click **"Enter App"** button or **"Sign In →"** link → lands on `/login` | *"Ab andar chalte hain. Yeh hamara login page hai — real authentication, Supabase se. Demo accounts hain."* |
| 1:15 | Click **"Vibhag Pramukh"** pill → click **Sign In** → redirects to `/dashboard` | *"Vibhag Pramukh se login — sabse senior local role. Ek click me credentials fill, Sign In — done."* |

### Act 2 — Vibhag Pramukh View (3 min)

**Logged in as: `demo.vibhag@example.com`**

| Time | Route | What to do | What to say |
|------|-------|-----------|-------------|
| 1:30 | `/dashboard` | Point to KPI cards — Total Events, Pending Reviews, Published Articles, Registrations | *"Dashboard pe real KPIs — animated counters. Sab database se aa raha hai, hardcoded nahi."* |
| 2:00 | `/dashboard` | Click any event in list → detail sheet opens. Point to checklist, date, description | *"Har event ka poora planning — designing, food, seating, sound/mic, camera, screen, lights. Sab checklist me track hota hai."* |
| 2:30 | `/dashboard` | Show Vritt section — attendance count, media URLs, report text, status | *"Event ke baad vritt (report) submit hota hai — kitne log aaye, media links, summary. Draft se Submitted, phir Reviewed."* |
| 3:00 | Bell icon | Click notification bell — show pending review items | *"Notification bell me role-specific alerts — Vibhag Pramukh ko final approval pending events dikhte hain."* |
| 3:15 | `/aalekh` | Click sidebar **Aalekh Likhna**. Show articles with various statuses | *"Aalekh section — articles manage hote hain. Draft, Pending Unit Head Review, Pending Aayam Review, Published — poora workflow."* |
| 3:45 | `/aalekh` | Click an article to show values checklist (Rashtra Pratham, No Divisive Content) | *"Values checklist — Rashtra Pratham, Culturally Grounded, Balanced Tone, No Divisive Content. Quality gate hai."* |
| 4:00 | `/prachar` | Click sidebar **Prachar**. Show platform table — checkboxes, skip reasons | *"Prachar tracking — WhatsApp, Facebook, Instagram, Telegram. Har platform pe post kiya ya nahi, skip reason mandatory hai."* |
| 4:30 | `/prachar` | Scroll to template carousel (don't click "Use" buttons) | *"5 ready-made poster templates hain — Event Poster, Vimarsh Quote Card, Book Discussion, Youth Program, Sammelan Invite."* |

### Act 3 — Unit Head View (1.5 min)

**Logout → Login as `demo.unithead@example.com` OR use role dropdown if DEMO_ROLE_SWITCH is on.**

| Time | What to do | What to say |
|------|-----------|-------------|
| 4:45 | Click LogOut icon → go to `/login` → click **"Unit Head"** pill → Sign In | *"Ab Unit Head ka view dekhte hain. Logout, naya account login."* |
| 5:00 | On `/dashboard` — show events list, click "Create Event" button to show dialog | *"Unit Head apne unit ke events create kar sakta hai — title, date, description, checklist sab yahan."* |
| 5:30 | Go to `/aalekh` — show articles pending "Pending Unit Head Review" | *"Unit Head ko articles review karne hote hain pehle — draft aata hai, Unit Head approve karta hai, phir Aayam Pramukh ko jaata hai."* |
| 6:00 | Click bell icon — show unit-level notifications | *"Har role ko sirf apne relevant notifications dikhte hain — Unit Head ko Unit Head pending items."* |

### Act 4 — Karyakarta View (1.5 min)

**Logout → Login as `demo.karyakarta@example.com`**

| Time | What to do | What to say |
|------|-----------|-------------|
| 6:15 | Logout → `/login` → click **"Karyakarta"** pill → Sign In | *"Ab Karyakarta — ground-level worker ka view."* |
| 6:30 | On `/dashboard` — show limited event view (view-only, cannot approve) | *"Karyakarta events dekh sakta hai lekin approve nahi kar sakta. Limited access — by design."* |
| 7:00 | Go to `/aalekh` — show article creation (can draft, cannot publish) | *"Karyakarta article likh sakta hai — draft save hota hai, review ke liye Unit Head ko jaata hai."* |
| 7:15 | Go to `/vimarsh` — browse topics | *"Vimarsh sab ke liye accessible — study material sabko milta hai, role se fark nahi padta."* |

### Act 5 — Polish + Close (2.5 min)

**Login as `demo.vibhag@example.com` again (or use role switch)**

| Time | What to do | What to say |
|------|-----------|-------------|
| 7:30 | Login back as Vibhag Pramukh | *"Wapas Vibhag Pramukh view me."* |
| 7:45 | Toggle dark mode (Moon/Sun icon in navbar) | *"Dark mode — ek click me toggle. Professional look."* |
| 8:00 | Toggle language (EN/हि button) — show Hindi labels | *"Hindi-English bilingual — labels, sublabels, navigation sab switch hote hain."* |
| 8:15 | Quick flash: `/feed` (published articles), `/directory` (Sampark — login-only) | *"Aur bhi modules — published feed, member directory (protected), E-Library, Aaj ka Itihas calendar."* |
| 8:30 | Come back to `/dashboard` | *"Summary: Events, reports, articles, review workflow, social media tracking, intellectual topics — sab ek jagah, role-based, real database."* |
| 9:00 | Show `/login` page one more time | *"Aur proper login/logout hai — no console hacks, production-ready auth flow."* |
| 9:30 | Closing statement (see Section 6) | |

---

## 4. What NOT to Show or Click

| # | Item | Where | Why |
|---|------|-------|-----|
| 1 | **Dayitv page** | `/dayitv` sidebar item | Static placeholder — hierarchy data not wired to real DB yet |
| 2 | **Template "Use" buttons** | `/prachar` template carousel | Visual-only — clicking does nothing meaningful |
| 3 | **File upload fields** | Event/Aalekh forms | Supabase storage upload not implemented — will error or do nothing |
| 4 | **Calendar page** | `/calendar` | May have no seeded data — verify before demo, skip if empty |
| 5 | **History page** | `/history` | Static/example content — don't deep-dive |
| 6 | **Library page** | `/library` | OK to flash briefly, don't deep-dive |
| 7 | **Registration form links** | `/form/[eventId]` | Only works if event has form config seeded |
| 8 | **Voting/poll pages** | `/vote/[eventId]` | Only works if poll is seeded |
| 9 | **Create Event as Karyakarta** | `/dashboard` create button | May fail based on permissions — don't demo this |
| 10 | **Editing/deleting seeded data** | Any form | Don't modify seeded content — it breaks the flow for next demo |
| 11 | **DevTools or terminal** | Browser | Never share screen with console open |
| 12 | **`.env.local` file** | Editor | Contains secrets |

### General Demo Rules
- **Don't scroll too fast** — let KPI counter animations complete
- **Don't click random sidebar items** you haven't verified
- **Don't type into forms** unless you know the save works end-to-end
- **Max 2–3 account switches** in the full demo — more gets confusing
- **If a toast error appears**, move on immediately — don't acknowledge it

---

## 5. Likely Client Questions and Best Answers

### "Abhi kya ready hai?"

*"5 core modules ready hain: (1) Event management with checklist planning aur vritt reports, (2) Aalekh writing with multi-tier review aur values checklist, (3) Prachar tracking across WhatsApp-Facebook-Instagram-Telegram, (4) Vimarsh ke 15 discourse topics with curated resources, (5) Proper login/logout with role-based access. Real Supabase database hai — demo data nahi, actual data."*

### "Kya abhi live use ho sakta hai?"

*"Core workflow usable hai — events create karo, reports submit karo, articles likho-review karo, prachar track karo. File upload aur kuch advanced features ka kaam chal raha hai. Day-to-day operations ke liye yeh version abhi se use ho sakta hai pilot mode me."*

### "Next kya bacha hai?"

*"Priority list: (1) File/photo upload for events aur articles, (2) Dayitv page ka real organizational data wiring, (3) Analytics dashboard for event/article trends. Uske baad mobile optimization, PDF report export, aur notification emails."*

### "AI features kab aayenge?"

*"Phase 2 me planned hai. Pehle sahi data collection aur workflows stable karna zaroori hai — AI tab best kaam karta hai jab quality data ho. Likely features: article content suggestions, event summary auto-generation, topic recommendations for karyakartas."*

### "Kya ye poore prant me scale hoga?"

*"Haan, architecture isi ke liye banayi hai. Abhi Bhopal Vibhag ka pilot hai. Database me vibhag/unit/aayam hierarchy hai — naye vibhag add karne me sirf data seeding lagegi, code change nahi. Supabase cloud pe hai toh infrastructure scaling automatic hai."*

### "Role-wise access secure hai?"

*"Haan, do level pe. (1) UI level — har role ko uska relevant data aur buttons dikhte hain. (2) Database level — Supabase Row Level Security policies lagi hain, matlab koi API directly bhi call kare toh apne scope se bahar ka data nahi dekh sakta. Karyakarta sirf likh sakta hai, approve nahi kar sakta — yeh enforce hai."*

### "Dayitv live kyu nahi hai?"

*"Dayitv ka UI bana hua hai lekin har unit ke har role ka mapping real data se wiring bacha hai. Jaise hi complete organizational mapping mil jaayegi, 1-2 days me live ho jayega."*

---

## 6. Final Demo Closing Statement

> Speak this naturally on the call:

*"Toh yeh tha Pragya Pravah Bhopal Vibhag ka pilot system.*

*Jo ready hai: Proper login-logout, 4 role-based accounts,
 event management with planning checklist aur vritt reports, Aalekh writing with Unit Head → Aayam Pramukh review chain aur values checklist, Prachar tracking across 4 social platforms with skip reasons, aur Vimarsh ke 15 discourse topics with curated study material. Real Supabase database hai, Row Level Security se secure hai, dark mode aur Hindi-English bilingual support hai.*

*Jo next aayega: File upload, Dayitv data wiring, analytics dashboard, aur Phase 2 me AI features.*

*Scale kaise hoga: Bhopal Vibhag me pilot stable hone do, phir naye vibhag add karna sirf data seeding hai — code change nahi chahiye. Architecture multi-vibhag ready hai.*

*Suggestion hai ki pilot use shuru karein — real feedback se product aur better banega."*

---

## Quick Reference Card

```
LOGIN: http://localhost:3000/login
  → Click any role pill → credentials auto-fill → Sign In

ACCOUNTS:
  Vibhag Pramukh  → demo.vibhag@example.com
  Aayam Pramukh   → demo.aayam@example.com
  Unit Head       → demo.unithead@example.com
  Karyakarta      → demo.karyakarta@example.com
  Password (all)  → Password123!

LOGOUT: Click LogOut icon (right end of navbar) → returns to /login

SAFE DEMO ROUTES:
  /login       Login page (public)
  /            Landing page (public) / ERP Launchpad (after login)
  /parichay    Org structure (public)
  /vimarsh     Discourse topics (public)
  /feed        Published articles (public)
  /dashboard   Events + reports (protected)
  /aalekh      Article management (protected)
  /prachar     Social distribution (protected)
  /directory   Sampark directory (protected)

DO NOT OPEN:
  /dayitv      Not wired to real data
  /calendar    May be empty
  /form/[id]   Only if event form is seeded
  /vote/[id]   Only if poll is seeded

NAVBAR CONTROLS (left to right):
  Moon/Sun      Dark mode toggle
  Bell          Role-specific notifications
  EN/हि         Language toggle
  Shield+Role   Role badge (dropdown if DEMO_ROLE_SWITCH=true)
  LogOut icon   Sign out → /login
```
