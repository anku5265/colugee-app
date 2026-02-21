# Teacher App Backend - Next.js API

Next.js backend API for the Teacher/Authority App with Supabase integration.

## 🚀 Features

- **Authentication**: Login for teachers and authorities
- **Profile Management**: Get and update user profiles
- **Approval Requests**: Manage approval requests
- **Announcements**: Create and fetch announcements
- **Institution Stats**: View institution statistics
- **Teaching Schedule**: Manage class schedules
- **Daily Streak**: Track daily activity

## 📦 Installation

```bash
cd backend
npm install
```

## 🔧 Configuration

Create `.env.local` file:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret
API_PORT=3002
NODE_ENV=development
```

## 🏃 Running

```bash
# Development
npm run dev

# Production build
npm run build
npm start
```

Server runs on: `http://localhost:3002`

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - Teacher/Authority login

### Profile
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update user profile

### Approvals
- `GET /api/approvals` - Get pending approval requests
- `PUT /api/approvals` - Update approval status

### Announcements
- `GET /api/announcements` - Get announcements
- `POST /api/announcements` - Create announcement

### Statistics
- `GET /api/stats` - Get institution statistics

### Schedule
- `GET /api/schedule` - Get teacher's schedule

### Streak
- `POST /api/streak` - Update daily streak

## 🔐 Authentication

All endpoints (except login) require Bearer token:

```
Authorization: Bearer <your_token>
```

## 🛠️ Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Supabase
- JWT Authentication

## 📝 Notes

- API runs on port 3002
- Frontend should call these APIs
- All responses are JSON format
- Role-based access control implemented
