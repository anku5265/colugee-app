# Colugee Real - College Management Platform

A comprehensive college management platform with separate applications for students and teachers.

## 📁 Project Structure

```
colugee-real/
├── student-app/          # Student portal application
└── teacher-app/          # Teacher portal application
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

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI Framework**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth)
- **State Management**: React Query
- **Form Handling**: React Hook Form + Zod

## 📦 Installation

### Student App

```bash
cd student-app
npm install
npm run dev
```

Access at: `http://localhost:8080`

### Teacher App

```bash
cd teacher-app
npm install
npm run dev
```

Access at: `http://localhost:8081`

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
