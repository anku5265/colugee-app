# 🚀 Quick Start Guide

## Simple Way to Run Apps

### Student App

**Option 1: Double-click the batch file**
```
Double-click: START_STUDENT_APP.bat
```

**Option 2: Manual commands**
```bash
# Terminal 1 - Backend
cd student-app/backend
npm install
npm run dev

# Terminal 2 - Frontend  
cd student-app
npm run dev
```

✅ **Access:**
- Frontend: http://localhost:8080
- Backend API: http://localhost:3001

---

### Teacher App

**Option 1: Double-click the batch file**
```
Double-click: START_TEACHER_APP.bat
```

**Option 2: Manual commands**
```bash
# Terminal 1 - Backend
cd teacher-app/backend
npm install
npm run dev

# Terminal 2 - Frontend
cd teacher-app
npm run dev
```

✅ **Access:**
- Frontend: http://localhost:8081
- Backend API: http://localhost:3002

---

## First Time Setup

If running for the first time, install all dependencies:

```
Double-click: INSTALL_ALL.bat
```

Or manually:
```bash
cd student-app/backend
npm install

cd ../..
cd teacher-app/backend
npm install
```

---

## What's Running?

### Student App
- **Frontend** (Port 8080): React + Vite + TypeScript
- **Backend** (Port 3001): Next.js API with 8 endpoints

### Teacher App
- **Frontend** (Port 8081): React + Vite + TypeScript
- **Backend** (Port 3002): Next.js API with 7 endpoints

---

## Troubleshooting

**Problem: Port already in use**
```bash
# Kill process on port 8080
npx kill-port 8080

# Kill process on port 3001
npx kill-port 3001
```

**Problem: Dependencies not installed**
```bash
# Run INSTALL_ALL.bat or manually:
cd student-app/backend
npm install
```

**Problem: Backend not starting**
- Check if `.env.local` file exists in backend folder
- Make sure Node.js is installed (v18 or higher)

---

## Files Created

- `START_STUDENT_APP.bat` - Start student app (frontend + backend)
- `START_TEACHER_APP.bat` - Start teacher app (frontend + backend)
- `INSTALL_ALL.bat` - Install all dependencies

---

## Next Steps

1. ✅ Run `INSTALL_ALL.bat` (first time only)
2. ✅ Run `START_STUDENT_APP.bat` or `START_TEACHER_APP.bat`
3. ✅ Open browser to http://localhost:8080 or http://localhost:8081
4. ✅ Start coding!

---

**Need help?** Check `BACKEND_SETUP.md` for detailed API documentation.
