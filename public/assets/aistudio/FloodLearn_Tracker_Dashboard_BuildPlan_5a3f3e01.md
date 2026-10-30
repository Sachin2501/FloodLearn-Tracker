## 1. Problem Statement

In flood-prone districts in India, children’s education depends almost entirely on a fragile, single-channel system: physical classrooms, physical books, and in-person teaching.

When floods arrive:

- Schools close suddenly (sometimes for weeks).
- Textbooks and notebooks are often damaged or inaccessible.
- Teachers and students are displaced or cut off by water and damaged roads.
- There is no simple, shared way to track:
  - Which schools are closed and for how long.
  - Which students are still accessing any kind of learning (study circles, radio, phone lessons, pocket lessons, etc.).
  - Whether emergency learning materials (offline content, worksheets, radio schedules) actually reach students.
- Neither the education department nor disaster management teams have actionable, real-time visibility or **clear accountability** for learning loss during floods.

Disaster-related learning loss is therefore:
- **Unmeasured** – no simple, quick reporting mechanism.
- **Unprioritized** – no live dashboard that shows gaps.
- **Ownerless** – no clear assignment of follow-ups to specific officials.

As a result, children in flood-prone communities repeatedly fall behind, even when low-cost, backup learning options could be deployed if data and responsibilities were clearer.

---

## 2. Solution Overview – FloodLearn Tracker Dashboard

**FloodLearn Tracker Dashboard** is a lightweight web and SMS/WhatsApp-based system that allows teachers, volunteers, NGOs, and district officials to **track and respond to learning continuity during floods**.

Core idea:

1. **Local teachers/volunteers send ultra-short check-ins** via **SMS or WhatsApp** about:
   - School status (open/closed/partially open).
   - Students’ access to learning (study circles, pocket lessons, radio, phone teaching).
   - Learning material distribution (who received what).
2. These reports are **aggregated and visualized** on:
   - A **color-coded Learning Continuity Scorecard** showing each school/cluster’s status.
   - A **map-based Status Board** showing which villages are okay, at risk, or in crisis.
3. The system uses rules to **automatically create and assign tasks** (e.g., “Deploy mobile learning hub”, “Deliver offline content pack”) to specific officials or NGO coordinators and track their status.

This converts invisible learning loss into **visible, actionable data with clear ownership**, helping district education and disaster-management officials prioritize interventions during floods.

---

## 3. Target Users and Needs

### 3.1 Primary Users

1. **School Teachers & Headmasters**
   - Need a simple, low-data way to report school status and student engagement.
   - Need to feel that their reports lead to action (materials delivered, support given).
   - Often only have basic phones or intermittent smartphone access.

2. **Local Volunteers & Community Educators**
   - Need a quick mechanism to report from the field (study circles, informal classes).
   - May not have login credentials, so SMS/WhatsApp access is essential.

3. **District Education Officers / Cluster Resource Coordinators**
   - Need district- or block-level overviews of:
     - Which schools are most affected.
     - Which areas have the worst learning continuity scores.
   - Need to assign and monitor follow-up tasks to field staff.

4. **Disaster Management Officials / Local NGOs**
   - Need to overlay flood impact with learning continuity data.
   - Need to coordinate response (e.g., where to send offline content kits, solar chargers, or volunteers).

### 3.2 Secondary Users

5. **State Education / NGO Program Leads**
   - Interested in aggregated analytics and trends.
   - Need to know which districts/blocks routinely suffer high learning loss.

---

## 4. Key Features

You must implement **all** of these; they are core to the build.

1. **SMS/WhatsApp Reporting System**
   - Teachers and volunteers can send structured or semi-structured messages:
     - e.g., `SCH123 CLOSED 3DAYS STUDENTS_ENGAGED=15 MATERIALS_SENT=YES`
   - Supports:
     - School closure status.
     - Student engagement (approx. number or simple scale).
     - Learning material distribution (who received what).
   - Optimized for low bandwidth and basic phones.

2. **Color-Coded Learning Continuity Scorecard**
   - Web dashboard card/table showing:
     - Each village / school / cluster.
     - Status as **Green / Yellow / Red** (or similar scale).
   - Score is based on recent SMS/WhatsApp reports:
     - Factors: days closed, % students engaged, materials distributed.
   - Each row shows:
     - Score, latest report time, and **responsible official**.
   - Allows filtering by block, cluster, school type, etc.

3. **Map-Based Status Board**
   - Basic map (e.g., district outline with pins/markers) showing:
     - Each school/village as a colored marker (using the scorecard color).
   - Hover/click on marker to see:
     - Latest learning continuity score.
     - Short summary of status and pending tasks.
   - Useful for quick, high-level situational awareness during floods.

4. **Automatic Task Assignment**
   - Rules engine that converts low learning continuity scores or specific triggers (e.g., “RED score for 3 days”) into tasks.
   - Tasks examples:
     - “Distribute offline content pack to School SCH123.”
     - “Initiate phone-based group calls for Grade 6.”
   - Each task is:
     - Assigned automatically to a specific official (based on mapping).
     - Trackable (status: Open, In-Progress, Done).
     - Visible on the dashboard and optionally via email/WhatsApp notifications.

5. **Basic Admin & Configuration Panel (Optional but Recommended)**
   - Manage:
     - School/village master data (IDs, names, GPS coordinates).
     - Mapping of schools to officials for task assignment.
     - Thresholds for Green/Yellow/Red scoring.

---

## 5. User Flow

### 5.1 User Flow: Teacher / Volunteer Reporting via SMS/WhatsApp

1. **User receives registration / onboarding info**
   - They are given:
     - A school/village code (e.g., `SCH123`).
     - A short format cheat-sheet (paper or WhatsApp message) explaining how to send reports.

2. **User sends a status message**
   - Example SMS/WhatsApp to the system number:
     - `SCH123 CLOSED DAYS=2 ENGAGED=20 MATERIALS=NO`
   - Simpler fallback:
     - `SCH123 CLOSED 2 20 NO`
   - The AI or parser interprets:
     - School = SCH123, Status = Closed, Days closed = 2, Engaged students = 20, Materials distributed = No.

3. **System parses and validates the report**
   - If formatting is ambiguous, system replies:
     - “We received: CLOSED for 2 days, 20 students engaged, materials not delivered. Reply YES to confirm or send again.”
   - On confirmation, report is stored.

4. **Score is updated**
   - The Learning Continuity Score for SCH123 is recalculated based on:
     - Days closed.
     - Engagement level.
     - Materials status.
   - Score is updated across dashboard and map.

5. **Automatic tasks triggered**
   - If score is Red (e.g., closed >3 days and <30% engaged):
     - System auto-creates tasks:
       - “Deploy offline content pack to SCH123.”
       - “Call headmaster of SCH123 to plan study circles.”
   - Tasks are assigned to responsible officials.

6. **Optional feedback to teacher/volunteer**
   - SMS/WhatsApp reply:
     - “Thanks. Your school’s status is now RED. Task created for Block Officer Sharma to deliver offline content within 2 days.”

---

### 5.2 User Flow: District / Block Official Using the Dashboard

1. **Login**
   - Official logs into the web dashboard with email/password or OAuth.

2. **View the Map-Based Status Board**
   - Sees a district map with markers:
     - Green = good continuity.
     - Yellow = at risk.
     - Red = critical.
   - Zoom/pan or filter by block/cluster.

3. **Drill down via Learning Continuity Scorecard**
   - Clicks a cluster to open scorecard table:
     - Columns: School/Village, Score Color, Last Reported, Days Closed, Engagement %, Materials Delivered?, Assigned Official, Pending Tasks.
   - Can sort by “Worst first” (Red scores at top).

4. **Review Automatic Tasks**
   - Navigates to a “Tasks” tab:
     - Shows tasks auto-generated from low scores.
     - States: Open / In-Progress / Done.
     - Filter by assigned official or severity.

5. **Take Action & Update Task Status**
   - For a specific school:
     - Clicks task “Deliver offline content pack” → sets to “In-Progress” after assigning to team.
   - After confirmation of delivery (e.g., from phone call or from a follow-up SMS from teacher):
     - Marks task as “Done.”
   - Task completion updates the school’s status notes.

6. **Monitor improvement**
   - As teachers send new SMS/WhatsApp reports (e.g., materials delivered, engagement increased), the score moves:
     - From Red → Yellow → Green.
   - Official uses these trends to:
     - Identify areas where interventions are working or failing.

---

### 5.3 User Flow: Admin / Program Manager

1. **Login to Admin Panel**
   - Restricted access.

2. **Configure School & Official Mapping**
   - Upload or edit:
     - Schools with IDs, names, GPS coordinates, and cluster/block mapping.
   - Associate each school/cluster with:
     - One or more responsible officials (for automatic task assignment).

3. **Define Scoring Rules**
   - Set thresholds, e.g.:
     - Green: days_closed ≤ 1 AND engagement ≥ 60% AND materials=YES.
     - Yellow: 2–3 days closed OR 30–60% engagement.
     - Red: >3 days closed OR <30% engagement OR materials=NO for >3 days.

4. **Define Automatic Tasks Rules**
   - Example rules:
     - If Red for >2 consecutive reports → create “Deploy offline content”.
     - If Yellow for >5 days → create “Check-in call with headmaster”.

---

## 6. Technical Approach

Aim: Build something realistic for a student hackathon, prioritizing **SMS/WhatsApp reporting**, **scorecard**, **map**, and **automatic task assignment** with a simple rules engine.

### 6.1 Overall Architecture

- **Frontend Web App**
  - For dashboard, scorecard, map, tasks, and admin panel.
- **Backend API**
  - For SMS/WhatsApp webhook handling, data storage, scoring logic, task creation, and serving data to frontend.
- **Database**
  - Store schools, reports, scores, tasks, and user accounts.
- **Third-Party Integrations**
  - SMS/WhatsApp provider (e.g., Twilio, Gupshup, WhatsApp Cloud API).
  - Optional: Map tiles (Mapbox, OpenStreetMap).

Architecture style: Simple RESTful API + single-page app (SPA) or server-rendered views (depending on hackathon team skills).

---

### 6.2 Suggested Tech Stack

**Frontend:**
- Framework: React (or Vue) for SPA; or simple server-side rendered pages with Django/Flask/Express if preferred.
- UI Components:
  - A table component for the **Learning Continuity Scorecard**.
  - A map component:
    - Map library: Leaflet.js (lightweight, works with OSM), or Mapbox GL JS.
- Styling:
  - Tailwind CSS or Bootstrap for rapid UI.

**Backend:**
- Language/Framework: 
  - Node.js with Express, or
  - Python with Django/Flask/FastAPI.
- Responsibilities:
  - Expose endpoints:
    - `POST /sms-webhook` – handle SMS/WhatsApp messages.
    - `GET /schools` – list schools with current scores.
    - `GET /schools/:id` – details and history.
    - `GET /tasks` – list tasks with filters.
    - `POST /tasks/:id/status` – update task status.
    - `POST /admin/import-schools` (optional for seeding data).
  - Run scoring logic and automatic task creation after each new report.

**Database:**
- PostgreSQL or MySQL (or SQLite for hackathon simplicity).
- Key tables:
  - `schools` (id, code, name, lat, lng, cluster_id, block_id, district, etc.).
  - `reports` (id, school_id, reporter_phone, timestamp, status, days_closed, students_engaged, materials_status, raw_message).
  - `scores` (id, school_id, timestamp, score_value, score_color, computed_fields).
    - Or just store latest scores directly on `schools` and keep minimal history.
  - `tasks` (id, school_id, created_at, description, status, severity, assigned_official_id, trigger_reason).
  - `officials` (id, name, phone, email, role, cluster/block mapping).
  - `users` (for login to dashboard; may overlap with officials).

---

### 6.3 SMS/WhatsApp Reporting System Implementation

1. **Integration**
   - Use Twilio, Gupshup, or WhatsApp Cloud API to receive messages:
     - Configure webhook URL to point to backend (`/sms-webhook`).
2. **Message Parsing Logic**
   - On incoming message:
     - Extract sender phone number.
     - Parse text using simple regex-based or rule-based parser:
       - Strategy:
         - Split by space or newlines.
         - First token = school code (`SCH123`).
         - Then parse keywords or positional values:
           - Look for tokens like `CLOSED`, `OPEN`, `PARTIAL`.
           - Look for `DAYS=x`, `ENGAGED=y`, `MATERIALS=YES/NO`.
         - If positional: treat `SCH123 CLOSED 3 20 YES` as:
           - Status=CLOSED, days_closed=3, engaged=20, materials=YES.
3. **Validation and Feedback**
   - If school code not found:
     - Reply: “School code not recognized. Please check and resend.”
   - If key fields missing:
     - Reply with a simple example format.
   - On success:
     - Store in `reports`.
     - Acknowledge: “Report saved for SCH123. Status: Closed (2 days), 20 students engaged, materials: NO.”

4. **Score Calculation**
   - After saving, run scoring function:
     - Inputs: last N reports (e.g., 3) + configured thresholds.
     - Output: `score_value` (0–100), `score_color` (Green/Yellow/Red).
   - Update `schools.latest_score_color` and `schools.latest_score_value`.

---

### 6.4 Color-Coded Learning Continuity Scorecard Implementation

**Backend:**
- Endpoint `GET /scorecard?block_id=...`:
  - Returns list of schools with:
    - id, name, code, cluster/block, latest_score_color, latest_score_value, last_report_timestamp, days_closed, students_engaged, materials_status, assigned_official_name, number_of_open_tasks.

**Frontend:**
- Page: `/dashboard`:
  - Table with rows = schools (filtered by user’s area if needed).
  - Columns:
    - School Name / Code
    - Color indicator (Green/Yellow/Red dot).
    - Score numeric (optional).
    - Days Closed (from last report).
    - Engagement (students or percentage).
    - Materials Delivered (Yes/No).
    - Assigned Official.
    - Open Tasks count.
  - Filters:
    - By score color (show only Red/Yellow).
    - By block/cluster.

---

### 6.5 Map-Based Status Board Implementation

**Backend:**
- Endpoint `GET /schools/map?block_id=...`:
  - Returns minimal JSON:
    - `[{ id, name, lat, lng, latest_score_color, latest_score_value, last_report_timestamp }]`.

**Frontend:**
- Page section: “Map View”:
  - Use Leaflet.js:
    - Base layer: OpenStreetMap tiles.
  - For each school:
    - Marker colored by `latest_score_color`.
  - On marker click:
    - Show popup with:
      - School name.
      - Score color and value.
      - Last reported data.
      - Link “View details” → opens scorecard row or detail page.

---

### 6.6 Automatic Task Assignment Implementation

**Rules Engine (simple):**
- On each new report (after scoring):
  - Evaluate rules like:
    - If `score_color == 'RED'` AND `days_closed >= 3`:
      - Check if there is an open task of type “Offline Content Delivery” for this school.
      - If not, create a new `task`:
        - `description = 'Deliver offline learning pack to ' + school.name`.
        - `status = 'OPEN'`.
        - `severity = 'HIGH'`.
        - `assigned_official_id = school.assigned_official_id`.
        - `trigger_reason = 'RED score + 3 days closed.'`
    - If `score_color == 'YELLOW'` for X days:
      - Create “Check-in call with headmaster” task.
- Optionally store rules in code for hackathon; can later move to DB for configurability.

**Task Management:**
- Backend endpoints:
  - `GET /tasks?assigned_official_id=...`
  - `POST /tasks/:id/status` (body: {status: "IN_PROGRESS" | "DONE"}).
- Frontend:
  - Tasks tab in dashboard:
    - List tasks assigned to logged-in official.
    - Buttons to change status.
- Notifications (optional within hackathon scope):
  - On task creation:
    - Send SMS/WhatsApp to assigned official:
      - “New task: Deliver offline learning pack to SCH123. Please update status in dashboard.”

---

### 6.7 Security & Access Control (Hackathon-Level)

- Basic authentication for web dashboard:
  - JWT-based or session-based login.
- Roles:
  - `admin` – access to configuration, all data.
  - `official` – sees only their block/cluster.
  - `viewer` – read-only view of district.
- SMS/WhatsApp access:
  - Any registered teacher/volunteer phone number may send data for a known school code (optional: whitelist numbers per school for more control).

---

## 7. Success Metrics

Define metrics to evaluate if FloodLearn Tracker Dashboard is effective.

### 7.1 Usage & Coverage Metrics

1. **Reporting Coverage**
   - % of schools in a target block that reported at least once during a flood period.
   - Goal (pilot): ≥ 60–70% of schools report at least once per week during floods.

2. **Report Frequency**
   - Average number of SMS/WhatsApp reports per school per week during flood periods.
   - Goal: ≥ 2–3 reports per week per active school.

3. **User Adoption**
   - Number of unique reporting phone numbers (teachers/volunteers).
   - Number of active dashboard users (officials) per week.

### 7.2 Learning Continuity & Response Metrics

4. **Task Resolution Rate**
   - % of automatically created tasks marked as “DONE” within a target timeframe (e.g., 3–5 days).
   - Goal: ≥ 70% completion rate within defined SLA.

5. **Time to Intervention**
   - Average time from:
     - A school turning Red in the scorecard → first relevant task created → task completed.
   - Aim to reduce this over time.

6. **Score Improvement Over Time**
   - For each flood period:
     - % of Red schools that move to Yellow/Green within 7–10 days.
   - Goal: majority of Red schools show improvement after interventions.

### 7.3 Data Quality & System Reliability Metrics

7. **Report Parsing Accuracy**
   - % of received messages that are successfully parsed into valid reports without manual intervention.
   - Target: ≥ 90% once formats are stabilized.

8. **System Uptime**
   - Uptime of SMS/WhatsApp webhook and dashboard during a flood event.
   - Aim: ≥ 99% during key days (can be monitored simply with a ping service).

### 7.4 Qualitative Feedback

9. **User Satisfaction (Teachers & Officials)**
   - Quick post-pilot survey:
     - “Did FloodLearn help you respond better to learning needs during floods?” (Yes/Somewhat/No).
   - Collect 3–5 short stories where data from the dashboard clearly led to a concrete supportive action for students.

---

This plan is structured so an AI prototyping tool (like Lovable or Bolt) can:

- Generate the **backend** for SMS/WhatsApp webhooks, report parsing, scoring, and tasks.
- Generate the **frontend** pages for:
  - Learning Continuity Scorecard.
  - Map-Based Status Board.
  - Task list and updates.
  - Minimal admin panel for schools and official mapping.
- Integrate all four confirmed core features:
  1. SMS/WhatsApp Reporting System  
  2. Color-Coded Learning Continuity Scorecard  
  3. Map-Based Status Board  
  4. Automatic Task Assignment