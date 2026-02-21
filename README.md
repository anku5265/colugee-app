# Colugee Real - College Management Platform

A comprehensive college management platform with separate applications for students and teachers, each with their own Next.js backend.

## 📁 Project Structure

```
colugee-real/
├── student-app/          # Student portal application
│   ├── src/              # React frontend (Vite + TypeScript)
│   └── backend/          # Next.js API backend (Port 3001)
└── teacher-app/          # Teacher portal application
    ├── src/              # React frontend (Vite + TypeScript)
    └── backend/          # Next.js API backend (Port 3002)
```

## 🚀 Features

### Student App
- **Dashboard**: View announcements, leaderboard, certificates
- **Attendance Tracking**: Monitor your attendance records
- **Schedule Viewer**: Check your class schedule
- **Connections**: Connect with peers (10 connections)
- **Certificates**: Manage your achievements (3 certificates)
- **Daily Streak**: Track your engagement (5 day streak)
- **Feed, Messages, Events, Resources, Study Groups**

### Teacher App
- **Dashboard**: Manage approvals, view institution stats
- **Teaching Schedule**: View your weekly teaching schedule (6 classes)
- **Attendance Management**: Track student attendance
- **Announcements**: Create and broadcast announcements
- **Approval System**: Handle approval requests
- **Calendar & Tasks**: Manage your schedule
- **Admin Panel**: User management with audit logging

## 🛠️ Tech Stack

### Frontend (Both Apps)
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI Framework**: Tailwind CSS + shadcn/ui
- **State Management**: React Query
- **Form Handling**: React Hook Form + Zod

### Backend (Both Apps)
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth + JWT
- **API**: RESTful APIs

## 📦 Installation & Setup

### Student App

**Frontend (React + Vite):**
```bash
cd student-app
npm install
npm run dev
```
Access at: `http://localhost:8080`

**Backend (Next.js API):**
```bash
cd student-app/backend
npm install
npm run dev
```
API runs on: `http://localhost:3001`

### Teacher App

**Frontend (React + Vite):**
```bash
cd teacher-app
npm install
npm run dev
```
Access at: `http://localhost:8081`

**Backend (Next.js API):**
```bash
cd teacher-app/backend
npm install
npm run dev
```
API runs on: `http://localhost:3002`

## 🎨 UI Features

- **Modern Sidebar Navigation**: Collapsible left sidebar with icons
- **Responsive Design**: Works on desktop and mobile
- **Dark Mode Support**: Built-in theme support
- **Smooth Animations**: Professional transitions and effects
- **Glass Morphism**: Modern glassmorphic design elements

## 🔐 Authentication

Currently in **demo mode** with bypass authentication for testing:

- **Student App**: Auto-login as "Test Student"
- **Teacher App**: Auto-login as "Prof. Test Teacher"

## 📊 Mock Data

Both apps include comprehensive mock data for testing:

- Student: 10 connections, 3 certificates, 3 announcements, leaderboard
- Teacher: 6 teaching classes, 2 approval requests, institution stats

## 🎯 Key Pages

### Student App
- Dashboard
- Feed
- Connect
- Messages
- Discover
- Collaborate
- Events
- Resources
- Study Groups

### Teacher App
- Dashboard
- Feed
- Connect
- Messages
- Discover
- Collaborate
- Events
- Resources
- Study Groups

## 🔧 Configuration

### Environment Variables

Create `.env` file in each app:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_key
```

## 📝 Development Notes

- Login is currently bypassed for easy testing
- Mock data is used when database is not available
- All features are fully functional with fallbacks
- No database errors - graceful error handling

## 🚀 Deployment

### Build for Production

```bash
# Student App
cd student-app
npm run build

# Teacher App
cd teacher-app
npm run build
```

## 📄 License

Private Project

## 👥 Contributors

- Development Team

## 📞 Support

For issues or questions, contact the development team.


## 🔌 Backend APIs

### Student Backend (Port 3001)

**Authentication:**
- `POST /api/auth/login` - Student login
- `POST /api/auth/signup` - Student registration

**Profile:**
- `GET /api/profile` - Get student profile
- `PUT /api/profile` - Update profile

**Features:**
- `GET /api/certificates` - Get certificates
- `POST /api/certificates` - Add certificate
- `GET /api/announcements` - Get announcements
- `POST /api/streak` - Update daily streak
- `GET /api/connections` - Get connections
- `GET /api/leaderboard` - Get leaderboard

### Teacher Backend (Port 3002)

**Authentication:**
- `POST /api/auth/login` - Teacher/Authority login

**Profile:**
- `GET /api/profile` - Get teacher profile
- `PUT /api/profile` - Update profile

**Features:**
- `GET /api/approvals` - Get approval requests
- `PUT /api/approvals` - Update approval status
- `GET /api/announcements` - Get announcements
- `POST /api/announcements` - Create announcement
- `GET /api/stats` - Get institution statistics
- `GET /api/schedule` - Get teaching schedule
- `POST /api/streak` - Update daily streak

## 🔐 Environment Variables

### Student Backend (.env.local)
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret
API_PORT=3001
NODE_ENV=development
```

### Teacher Backend (.env.local)
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret
API_PORT=3002
NODE_ENV=development
```

## 🚀 Running All Services

To run the complete application, you need to start 4 services:

1. **Student Frontend**: `cd student-app && npm run dev` (Port 8080)
2. **Student Backend**: `cd student-app/backend && npm run dev` (Port 3001)
3. **Teacher Frontend**: `cd teacher-app && npm run dev` (Port 8081)
4. **Teacher Backend**: `cd teacher-app/backend && npm run dev` (Port 3002)

## 📝 API Authentication

All API endpoints (except login/signup) require Bearer token authentication:

```javascript
fetch('http://localhost:3001/api/profile', {
  headers: {
    'Authorization': `Bearer ${your_token}`,
    'Content-Type': 'application/json'
  }
})
```

## 🎯 Key Features

### Student App
- Dashboard with announcements, leaderboard, certificates
- Attendance tracking
- Schedule viewer
- Connections management (10 connections)
- Certificates management (3 certificates)
- Daily streak tracking (5 day streak)
- Feed, Messages, Events, Resources, Study Groups

### Teacher App
- Authority dashboard with approval requests
- Institution statistics (450 students, 25 mentors, 35 teachers, 8 events)
- Teaching schedule management (6 classes)
- Attendance management
- Announcement creation and broadcasting
- Approval system for requests
- Calendar & task management
- Admin panel with audit logging

## 🔧 Development Notes

- Frontend apps use Vite for fast development
- Backend APIs use Next.js App Router
- All data is stored in Supabase PostgreSQL
- Authentication handled by Supabase Auth
- Mock data available for testing without database
- Login currently bypassed for easy testing

## 📚 Documentation

- Student Backend API: See `student-app/backend/README.md`
- Teacher Backend API: See `teacher-app/backend/README.md`
