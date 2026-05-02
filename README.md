# TaskMe — Team Task Management

A full-stack collaborative task management web application where users can create projects, assign tasks, and track progress in real-time.

## Features
- **User Authentication** — Signup/Login with JWT
- **Project Management** — Create projects, invite members (Admin/Member roles)
- **Kanban Board** — Drag-and-drop task management (To Do / In Progress / Done)
- **Task Details** — Subtasks, comments, priority, due dates, assignees
- **Dashboard** — KPI cards, donut chart, tasks per user, overdue tracking
- **Calendar View** — Monthly calendar with task due dates
- **Activity Log** — Track all project actions
- **CSV Export** — Download task data
- **Dark Mode** — Toggle between light and dark themes
- **Claymorphic UI** — Modern soft-shadow design system

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| Backend | Node.js, Express.js |
| Database | PostgreSQL (Neon) |
| Auth | JWT + bcrypt |
| Design | Claymorphic (Manrope font, clay shadows) |

## Setup & Run Locally

### Prerequisites
- Node.js 18+
- PostgreSQL database (or Neon account)

### 1. Clone the repo
```bash
git clone https://github.com/adityarao3/TaskMe.git
cd TaskMe
```

### 2. Setup the database
Run the schema file against your PostgreSQL database:
```bash
psql YOUR_DATABASE_URL -f backend/schema.sql
```

### 3. Backend setup
```bash
cd backend
npm install
```
Create `backend/.env`:
```
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_secret_key
PORT=5000
FRONTEND_URL=http://localhost:5173
```

### 4. Frontend setup
```bash
cd frontend
npm install
```
Create `frontend/.env`:
```
VITE_API_URL=http://localhost:5000
```

### 5. Run
```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

Open `http://localhost:5173`

## Deployment (Render)
1. Push code to GitHub
2. Create a new **Web Service** on Render
3. Connect your GitHub repo
4. Set Build Command: `cd frontend && npm install && npm run build && cd ../backend && npm install`
5. Set Start Command: `cd backend && node server.js`
6. Add environment variables:
   - `DATABASE_URL` — your Neon PostgreSQL connection string
   - `JWT_SECRET` — a secure secret key
   - `NODE_ENV` — `production`
   - `FRONTEND_URL` — your Render URL (e.g. `https://taskme-xxxx.onrender.com`)

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/signup | Register new user |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |
| GET | /api/projects | List user's projects |
| POST | /api/projects | Create project |
| GET | /api/projects/:id | Get project details |
| POST | /api/projects/:id/members | Invite member |
| DELETE | /api/projects/:id/members/:uid | Remove member |
| GET | /api/tasks?project_id= | List tasks |
| POST | /api/tasks | Create task |
| PUT | /api/tasks/:id | Update task |
| PATCH | /api/tasks/:id/status | Change status |
| DELETE | /api/tasks/:id | Delete task |
| GET | /api/dashboard | Dashboard metrics |
| GET/POST | /api/comments | Task comments |
| GET/POST/PATCH/DELETE | /api/subtasks | Task subtasks |
| GET | /api/activity | Activity log |

## License
ISC
