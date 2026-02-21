# Backend Setup Guide - Next.js APIs

## ✅ What Has Been Created

### Student App Backend (`student-app/backend/`)
- **Port**: 3001
- **Framework**: Next.js 14 with TypeScript
- **API Routes**: 8 endpoints

**Files Created:**
```
student-app/backend/
├── package.json
├── tsconfig.json
├── next.config.js
├── .env.local
├── .gitignore
├── README.md
└── src/app/api/
    ├── auth/
    │   ├── login/route.ts
    │   └── signup/route.ts
    ├── profile/route.ts
    ├── certificates/route.ts
    ├── announcements/route.ts
    ├── streak/route.ts
    ├── connections/route.ts
    └── leaderboard/route.ts
```

### Teacher App Backend (`teacher-app/backend/`)
- **Port**: 3002
- **Framework**: Next.js 14 with TypeScript
- **API Routes**: 7 endpoints

**Files Created:**
```
teacher-app/backend/
├── package.json
├── tsconfig.json
├── next.config.js
├── .env.local
├── .gitignore
├── README.md
└── src/app/api/
    ├── auth/login/route.ts
    ├── profile/route.ts
    ├── approvals/route.ts
    ├── announcements/route.ts
    ├── stats/route.ts
    ├── schedule/route.ts
    └── streak/route.ts
```

## 🚀 Installation Steps

### Step 1: Install Student Backend Dependencies

```bash
cd colugee-real/student-app/backend
npm install
```

### Step 2: Install Teacher Backend Dependencies

```bash
cd colugee-real/teacher-app/backend
npm install
```

### Step 3: Configure Environment Variables

Both backends have `.env.local` files already created. Update them with your actual Supabase credentials:

**Student Backend** (`student-app/backend/.env.local`):
```env
SUPABASE_URL=https://veopatdezecrgrnqmrrl.supabase.co
SUPABASE_ANON_KEY=your_actual_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret_key
API_PORT=3001
NODE_ENV=development
```

**Teacher Backend** (`teacher-app/backend/.env.local`):
```env
SUPABASE_URL=https://veopatdezecrgrnqmrrl.supabase.co
SUPABASE_ANON_KEY=your_actual_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret_key
API_PORT=3002
NODE_ENV=development
```

## 🏃 Running the Backends

### Start Student Backend
```bash
cd colugee-real/student-app/backend
npm run dev
```
✅ API available at: `http://localhost:3001`

### Start Teacher Backend
```bash
cd colugee-real/teacher-app/backend
npm run dev
```
✅ API available at: `http://localhost:3002`

## 📡 API Endpoints Summary

### Student Backend (Port 3001)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/login` | Student login | No |
| POST | `/api/auth/signup` | Student registration | No |
| GET | `/api/profile` | Get student profile | Yes |
| PUT | `/api/profile` | Update profile | Yes |
| GET | `/api/certificates` | Get certificates | Yes |
| POST | `/api/certificates` | Add certificate | Yes |
| GET | `/api/announcements` | Get announcements | Yes |
| POST | `/api/streak` | Update daily streak | Yes |
| GET | `/api/connections` | Get connections | Yes |
| GET | `/api/leaderboard` | Get leaderboard | Yes |

### Teacher Backend (Port 3002)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/login` | Teacher/Authority login | No |
| GET | `/api/profile` | Get teacher profile | Yes |
| PUT | `/api/profile` | Update profile | Yes |
| GET | `/api/approvals` | Get approval requests | Yes |
| PUT | `/api/approvals` | Update approval status | Yes |
| GET | `/api/announcements` | Get announcements | Yes |
| POST | `/api/announcements` | Create announcement | Yes |
| GET | `/api/stats` | Get institution stats | Yes |
| GET | `/api/schedule` | Get teaching schedule | Yes |
| POST | `/api/streak` | Update daily streak | Yes |

## 🔐 Authentication Flow

### 1. Login Request
```javascript
const response = await fetch('http://localhost:3001/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'student@example.com',
    password: 'password123'
  })
});

const data = await response.json();
// data.session.access_token - Use this for authenticated requests
```

### 2. Authenticated Request
```javascript
const response = await fetch('http://localhost:3001/api/profile', {
  headers: {
    'Authorization': `Bearer ${access_token}`,
    'Content-Type': 'application/json'
  }
});
```

## 🔄 Connecting Frontend to Backend

### Update Frontend API Calls

In your React frontend, update the Supabase client calls to use the Next.js backend:

**Before (Direct Supabase):**
```typescript
const { data } = await supabase.from('profiles').select('*');
```

**After (Next.js Backend):**
```typescript
const response = await fetch('http://localhost:3001/api/profile', {
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
  }
});
const data = await response.json();
```

## 📝 Example API Usage

### Student Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@test.com","password":"password123"}'
```

### Get Profile (Authenticated)
```bash
curl http://localhost:3001/api/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Create Announcement (Teacher)
```bash
curl -X POST http://localhost:3002/api/announcements \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "title":"Important Notice",
    "content":"Classes will resume tomorrow",
    "announcement_type":"college_circular",
    "audience":["all"]
  }'
```

## ✅ Testing the Setup

1. **Start both backends**
2. **Test student login**:
   ```bash
   curl -X POST http://localhost:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@student.com","password":"123456"}'
   ```
3. **Test teacher login**:
   ```bash
   curl -X POST http://localhost:3002/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"teacher@college.com","password":"123456"}'
   ```

## 🎯 Next Steps

1. ✅ Install dependencies for both backends
2. ✅ Update `.env.local` files with actual credentials
3. ✅ Start both backend servers
4. ✅ Test API endpoints
5. ✅ Update frontend to call backend APIs instead of direct Supabase
6. ✅ Deploy backends (Vercel recommended for Next.js)

## 🚨 Important Notes

- **Ports**: Student backend (3001), Teacher backend (3002)
- **CORS**: May need to configure CORS for production
- **Environment**: Don't commit `.env.local` files to git
- **Database**: Both backends use the same Supabase database
- **Authentication**: JWT tokens from Supabase Auth
- **Role-based**: Teacher backend checks for teacher/authority roles

## 📚 Additional Resources

- Next.js API Routes: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- Supabase JS Client: https://supabase.com/docs/reference/javascript
- TypeScript: https://www.typescriptlang.org/docs/

---

**Backend successfully created! 🎉**

Both student and teacher apps now have their own Next.js backends with complete API endpoints.
