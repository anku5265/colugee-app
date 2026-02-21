# Student App Backend - Next.js API

Next.js backend API for the Student App with Supabase integration.

## 🚀 Features

- **Authentication**: Login, Signup with Supabase Auth
- **Profile Management**: Get and update user profiles
- **Certificates**: CRUD operations for student certificates
- **Announcements**: Fetch announcements for students
- **Daily Streak**: Track and update daily activity streaks
- **Connections**: Manage student connections
- **Leaderboard**: View top students by streak

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
API_PORT=3001
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

Server runs on: `http://localhost:3001`

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration

### Profile
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update user profile

### Certificates
- `GET /api/certificates` - Get user certificates
- `POST /api/certificates` - Create certificate

### Announcements
- `GET /api/announcements` - Get announcements

### Streak
- `POST /api/streak` - Update daily streak

### Connections
- `GET /api/connections` - Get user connections

### Leaderboard
- `GET /api/leaderboard` - Get top users

## 🔐 Authentication

All endpoints (except login/signup) require Bearer token:

```
Authorization: Bearer <your_token>
```

## 🛠️ Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Supabase
- JWT Authentication

## 📝 Notes

- API runs on port 3001
- Frontend should call these APIs
- All responses are JSON format
