# 🗂️ TaskMe — Team Task Management Web Application

A full-stack collaborative task management platform where teams can create projects, assign tasks, and track progress in real-time. Built with a modern **Claymorphic UI** design system.

> **Live Demo**: [Deployed on Render](#deployment)

---

## 📑 Table of Contents

- [Overview](#overview)
- [Screenshots](#-screenshots)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Features](#features)
- [Extra Features Beyond Requirements](#-extra-features-beyond-requirements)
- [Application Flow](#application-flow)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Setup & Installation](#setup--installation)
- [Deployment](#deployment)

---

## Overview

TaskMe is a real-world collaborative web application designed for team-based task management — a simplified version of tools like **Trello** or **Asana**. Users can:

- Sign up and securely log in
- Create projects and invite team members
- Manage tasks across a **Kanban board** (To Do → In Progress → Done)
- Track deadlines, priorities, and team workload via a **Dashboard**
- Collaborate with **comments** and **subtasks**

---

## 📸 Screenshots

### Login Page
> Claymorphic split layout with branding on the left and clay-card sign-in form on the right. Features pill-shaped inset inputs, sage green CTA button, and soft clay shadows.

![Login Page](screenshots/login.png)

### Dashboard
> Real-time overview with KPI cards (Total Tasks, Completed, Overdue), donut chart distribution, personal task list with priority badges, and team workload progress bars.

![Dashboard](screenshots/dashboard.png)

### Projects
> Project cards with role badges (Owner/Member), member and task counts, filter tabs (All/Owned/Member), and clay-card hover animations.

![Projects Page](screenshots/projects.png)

### Create Project
> Claymorphic modal dialog with inset input fields, description textarea, and sage green action buttons.

![Create Project Modal](screenshots/create-project.png)

### Calendar View
> Full monthly calendar grid with task pills on due dates, today highlighting, month navigation, and color-coded priority indicators.

![Calendar View](screenshots/calendar.png)

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 19, TypeScript, Vite | Single Page Application (SPA) |
| **Styling** | Tailwind CSS v4, shadcn/ui | Claymorphic design system |
| **Backend** | Node.js, Express.js | RESTful API server |
| **Database** | PostgreSQL (Neon Cloud) | Persistent data storage |
| **Authentication** | JWT + bcrypt | Stateless auth with hashed passwords |
| **Fonts** | Manrope (Google Fonts) | Typography |
| **Icons** | Material Symbols Outlined | Iconography |

---

## Architecture

### System Overview

```mermaid
graph LR
    subgraph Client ["Frontend (React SPA)"]
        A[Login/Signup] --> B[Dashboard]
        B --> C[Projects]
        C --> D[Kanban Board]
        B --> E[Calendar View]
    end

    subgraph Server ["Backend (Express API)"]
        F[Auth Routes]
        G[Project Routes]
        H[Task Routes]
        I[Dashboard Routes]
        J[Comment Routes]
        K[Subtask Routes]
        L[Activity Routes]
    end

    subgraph DB ["Database (PostgreSQL)"]
        M[(users)]
        N[(projects)]
        O[(project_members)]
        P[(tasks)]
        Q[(comments)]
        R[(subtasks)]
        S[(activity_log)]
    end

    Client -->|HTTP + JWT| Server
    Server -->|SQL Queries| DB
```

### How It Works

1. **User visits the app** → React SPA loads in the browser
2. **Authentication** → User signs up/logs in → backend returns a **JWT token**
3. **Token stored** in `localStorage` → attached to every API request via Axios interceptor
4. **API calls** go from React → Express backend → PostgreSQL database
5. **In production**, the Express server serves both the API (`/api/*`) and the React build (static files)

---

## Features

### 1. 🔐 User Authentication
- Signup with **Name, Email, Password**
- Password hashing with **bcrypt** (12 salt rounds)
- Login returns a **JWT token** (24-hour expiry)
- Protected routes — middleware validates JWT on every API request
- Auto-logout on token expiry (401 interceptor)

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant D as Database

    U->>F: Enter email & password
    F->>B: POST /api/auth/login
    B->>D: SELECT user WHERE email = ?
    D-->>B: User record
    B->>B: bcrypt.compare(password, hash)
    B-->>F: JWT token + user data
    F->>F: Store token in localStorage
    F-->>U: Redirect to Dashboard
```

### 2. 📁 Project Management
- **Create projects** — creator automatically becomes **Admin**
- **Role-based access**: Admin vs Member
- Admin can **invite members** by email (user must be registered)
- Admin can **remove members** from projects
- Admin can **delete projects** entirely
- Members can view all projects they belong to

```mermaid
flowchart TD
    A[User Creates Project] --> B[User becomes Admin]
    B --> C{Admin Actions}
    C --> D[Invite Members by Email]
    C --> E[Remove Members]
    C --> F[Delete Project]
    C --> G[Create Tasks]
    C --> H[Assign Tasks]

    D --> I{User Exists in DB?}
    I -->|Yes| J[Added to project_members]
    I -->|No| K[Error: User not found]

    L[Member Role] --> M[View Project]
    L --> N[View Assigned Tasks]
    L --> O[Update Own Task Status]
    L --> P[Add Comments]
```

### 3. ✅ Task Management
- Create tasks with **Title, Description, Due Date, Priority**
- Assign tasks to specific team members
- Update task status via **drag-and-drop Kanban board**
- Three status columns: **To Do → In Progress → Done**
- Three priority levels: **Low, Medium, High**
- Search and filter tasks by priority

```mermaid
stateDiagram-v2
    [*] --> ToDo: Task Created
    ToDo --> InProgress: Start Working
    InProgress --> Done: Complete
    InProgress --> ToDo: Move Back
    Done --> InProgress: Reopen
    Done --> [*]: Archived
```

### 4. 📊 Dashboard & Metrics
- **Total Tasks** — count across all projects
- **Completed Tasks** — with completion percentage
- **Overdue Tasks** — flagged with warning indicators
- **Donut Chart** — visual breakdown by status (To Do / In Progress / Done)
- **Tasks Per User** — team workload visualization with progress bars
- **My Tasks** — personal task list sorted by urgency

---

## ⭐ Extra Features Beyond Requirements

These features go **above and beyond** the basic assignment specifications:

| # | Feature | Description |
|---|---------|-------------|
| 1 | **💬 Task Comments** | Threaded comments on any task with commenter name, timestamp, and real-time count on Kanban cards |
| 2 | **📋 Subtasks / Checklist** | Break tasks into smaller items, toggle completion, progress indicator (`done/total`) on cards |
| 3 | **📅 Calendar View** | Full monthly calendar grid showing tasks on due dates, color-coded by priority, month navigation |
| 4 | **📜 Activity Log** | Tracks all actions (task created, status changed, member invited) per project with timestamps |
| 5 | **📥 CSV Export** | One-click export of all project tasks as CSV (title, status, priority, assignee, due date) |
| 6 | **🌗 Dark Mode** | Full dark theme with adjusted clay shadows, persisted in localStorage |
| 7 | **🎨 Claymorphic Design** | Custom design system — soft inner/outer shadows, pill inputs, raised clay cards, warm cream + sage green palette |
| 8 | **🔒 RBAC (Role-Based Access)** | Backend-enforced Admin vs Member permissions on every API endpoint |
| 9 | **🔍 Task Search & Filters** | Real-time search by title + filter by priority level on Kanban board |
| 10 | **🖱️ Drag & Drop** | HTML5 drag-and-drop for moving tasks between Kanban columns |
| 11 | **⏰ Overdue Detection** | Auto-flags tasks past due date with warning indicators and "LATE" badges |
| 12 | **👥 Team Workload** | Per-user task distribution with visual progress bars on dashboard |

---

## Application Flow

### Complete User Journey

```mermaid
flowchart TD
    START([User Opens App]) --> AUTH{Authenticated?}
    AUTH -->|No| LOGIN[Login / Signup Page]
    AUTH -->|Yes| DASH[Dashboard]

    LOGIN -->|Submit Credentials| VERIFY{Valid?}
    VERIFY -->|No| ERROR[Show Error Message]
    VERIFY -->|Yes| TOKEN[Store JWT Token]
    TOKEN --> DASH

    DASH --> PROJECTS[Projects Page]
    DASH --> CALENDAR[Calendar View]

    PROJECTS --> CREATE[Create New Project]
    PROJECTS --> SELECT[Select Existing Project]

    CREATE --> KANBAN[Kanban Board]
    SELECT --> KANBAN

    KANBAN --> ADD_TASK[Create Task]
    KANBAN --> DRAG[Drag & Drop Status Change]
    KANBAN --> CLICK_TASK[Click Task Card]

    CLICK_TASK --> MODAL[Task Detail Modal]
    MODAL --> EDIT[Edit Title / Description / Priority]
    MODAL --> COMMENTS[Add Comments]
    MODAL --> SUBTASKS[Manage Subtasks]
    MODAL --> ASSIGN[Assign to Member]

    KANBAN --> INVITE[Invite Members]
    KANBAN --> EXPORT[Export CSV]
    KANBAN --> ACTIVITY[View Activity Log]

    DASH --> LOGOUT[Logout]
    LOGOUT --> LOGIN
```

### API Request Flow

```mermaid
sequenceDiagram
    participant Browser
    participant Axios as Axios Interceptor
    participant Express as Express Server
    participant Auth as Auth Middleware
    participant Route as Route Handler
    participant PG as PostgreSQL

    Browser->>Axios: API Call
    Axios->>Axios: Attach JWT from localStorage
    Axios->>Express: HTTP Request + Authorization Header

    Express->>Auth: Verify JWT Token
    Auth->>Auth: jwt.verify(token, secret)

    alt Token Invalid
        Auth-->>Browser: 401 Unauthorized
        Browser->>Browser: Clear token, redirect to /login
    end

    Auth->>Route: Authenticated Request
    Route->>PG: SQL Query
    PG-->>Route: Result Rows
    Route-->>Browser: JSON Response
```

### Invite Member Flow

```mermaid
flowchart LR
    A[Admin clicks Invite] --> B[Enter member email]
    B --> C[POST /api/projects/:id/members]
    C --> D{Email exists in users table?}
    D -->|Yes| E[Add to project_members]
    D -->|No| F[Return 404 error]
    E --> G[Log activity]
    G --> H[Member sees project in their list]
    F --> I[Show error: User not registered]
```

---

## Database Schema

```mermaid
erDiagram
    users {
        uuid id PK
        varchar name
        varchar email UK
        varchar password_hash
        timestamp created_at
    }

    projects {
        uuid id PK
        varchar name
        text description
        uuid owner_id FK
        timestamp created_at
    }

    project_members {
        uuid project_id FK
        uuid user_id FK
        varchar role
        timestamp joined_at
    }

    tasks {
        uuid id PK
        uuid project_id FK
        varchar title
        text description
        varchar status
        varchar priority
        uuid assigned_to FK
        uuid created_by FK
        date due_date
        timestamp created_at
    }

    comments {
        uuid id PK
        uuid task_id FK
        uuid user_id FK
        text content
        timestamp created_at
    }

    subtasks {
        uuid id PK
        uuid task_id FK
        varchar title
        boolean completed
        timestamp created_at
    }

    activity_log {
        uuid id PK
        uuid project_id FK
        uuid user_id FK
        varchar action
        text details
        timestamp created_at
    }

    users ||--o{ projects : "owns"
    users ||--o{ project_members : "joins"
    projects ||--o{ project_members : "has"
    projects ||--o{ tasks : "contains"
    users ||--o{ tasks : "assigned_to"
    tasks ||--o{ comments : "has"
    tasks ||--o{ subtasks : "has"
    projects ||--o{ activity_log : "logs"
    users ||--o{ activity_log : "performs"
```

---

## API Endpoints

### Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|:----:|
| `POST` | `/api/auth/signup` | Register new user | ❌ |
| `POST` | `/api/auth/login` | Login, returns JWT | ❌ |
| `GET` | `/api/auth/me` | Get current user profile | ✅ |

### Projects
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|:----:|
| `GET` | `/api/projects` | List user's projects | ✅ |
| `POST` | `/api/projects` | Create new project | ✅ |
| `GET` | `/api/projects/:id` | Get project details + members | ✅ |
| `DELETE` | `/api/projects/:id` | Delete project (Admin only) | ✅ |
| `POST` | `/api/projects/:id/members` | Invite member by email | ✅ |
| `DELETE` | `/api/projects/:id/members/:uid` | Remove member (Admin only) | ✅ |
| `GET` | `/api/projects/:id/export` | Export tasks as CSV | ✅ |

### Tasks
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|:----:|
| `GET` | `/api/tasks?project_id=` | List tasks in project | ✅ |
| `POST` | `/api/tasks` | Create task | ✅ |
| `PUT` | `/api/tasks/:id` | Update task details | ✅ |
| `PATCH` | `/api/tasks/:id/status` | Change task status | ✅ |
| `DELETE` | `/api/tasks/:id` | Delete task (Admin only) | ✅ |

### Comments & Subtasks
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|:----:|
| `GET` | `/api/comments?task_id=` | Get task comments | ✅ |
| `POST` | `/api/comments` | Add comment | ✅ |
| `GET` | `/api/subtasks?task_id=` | Get subtasks | ✅ |
| `POST` | `/api/subtasks` | Create subtask | ✅ |
| `PATCH` | `/api/subtasks/:id` | Toggle subtask completion | ✅ |
| `DELETE` | `/api/subtasks/:id` | Delete subtask | ✅ |

### Dashboard & Activity
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|:----:|
| `GET` | `/api/dashboard` | Get KPI metrics + task lists | ✅ |
| `GET` | `/api/activity?project_id=` | Get project activity log | ✅ |

---

## Setup & Installation

### Prerequisites
- **Node.js** 18 or higher
- **PostgreSQL** database (or free [Neon](https://neon.tech) account)

### 1. Clone the Repository
```bash
git clone https://github.com/adityarao3/TaskMe.git
cd TaskMe
```

### 2. Setup Database
Run the schema against your PostgreSQL database:
```bash
psql YOUR_DATABASE_URL -f backend/schema.sql
```

### 3. Backend Setup
```bash
cd backend
npm install
```

Create `backend/.env`:
```env
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
JWT_SECRET=your_secret_key_here
PORT=5000
FRONTEND_URL=http://localhost:5173
```

### 4. Frontend Setup
```bash
cd frontend
npm install
```

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000
```

### 5. Run Locally
```bash
# Terminal 1 — Start Backend
cd backend
npm run dev

# Terminal 2 — Start Frontend
cd frontend
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## Deployment

### Deployed on Render

| Setting | Value |
|---------|-------|
| **Build Command** | `cd frontend && npm install && npm run build && cd ../backend && npm install` |
| **Start Command** | `cd backend && node server.js` |
| **Environment** | `NODE_ENV=production` |

In production, the Express server serves both the API and the React build as static files — single service deployment.

### Environment Variables on Render
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret key for JWT signing |
| `NODE_ENV` | Set to `production` |
| `FRONTEND_URL` | Your Render URL or `*` |

---

## Design System

TaskMe uses a custom **Claymorphic (Clay UI)** design system:

- **Color Palette**: Warm cream (`#fcf9f8`) + sage green (`#496551`, `#c8e8ce`)
- **Typography**: Manrope font family (400–900 weights)
- **Shadows**: Multi-layered inner/outer shadows for clay depth effect
- **Components**: Clay cards, pressed inputs, pill buttons, ghost icon buttons
- **Border Radius**: 16px (cards), 9999px (pills/buttons)
- **Dark Mode**: Full dark clay theme with inverted shadow colors

---

## Folder Structure

```
TaskMe/
├── backend/
│   ├── middleware/
│   │   └── auth.js              # JWT verification middleware
│   ├── routes/
│   │   ├── auth.js              # Signup, Login, Me
│   │   ├── projects.js          # CRUD + members + export
│   │   ├── tasks.js             # CRUD + status change
│   │   ├── dashboard.js         # KPI metrics
│   │   ├── comments.js          # Task comments
│   │   ├── subtasks.js          # Task subtasks
│   │   └── activity.js          # Activity log
│   ├── db.js                    # PostgreSQL connection pool
│   ├── schema.sql               # Database schema
│   ├── server.js                # Express server + static serving
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/axios.ts         # Axios instance + JWT interceptor
│   │   ├── components/
│   │   │   ├── SideNavBar.tsx    # Sidebar navigation
│   │   │   ├── TopAppBar.tsx     # Top header bar
│   │   │   ├── TaskEditModal.tsx # Task detail modal
│   │   │   ├── Toast.tsx         # Toast notification system
│   │   │   └── ui/              # shadcn/ui components
│   │   ├── context/
│   │   │   ├── AuthContext.tsx   # Auth state management
│   │   │   └── ThemeContext.tsx  # Dark mode state
│   │   ├── pages/
│   │   │   ├── Login.tsx        # Login page
│   │   │   ├── Signup.tsx       # Signup page
│   │   │   ├── Dashboard.tsx    # Dashboard with metrics
│   │   │   ├── Projects.tsx     # Project list
│   │   │   ├── ProjectDetail.tsx # Kanban board
│   │   │   └── CalendarView.tsx # Calendar page
│   │   ├── index.css            # Claymorphic design system
│   │   └── App.tsx              # Routes + layout
│   ├── index.html
│   └── package.json
├── screenshots/                  # App screenshots
├── README.md
└── package.json                  # Root build scripts
```

---

## License

ISC © Aditya Rao
