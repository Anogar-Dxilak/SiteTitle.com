@echo off
echo ========================================================
echo Sherlock OSINT Tool - Starting Localhost Servers...
echo ========================================================

start "Sherlock Backend (FastAPI)" cmd /k "cd backend && python -m uvicorn app.main:app --reload --port 8000"
start "Sherlock Frontend (Vite)" cmd /k "cd frontend && npm run dev"

echo.
echo Servers are starting up!
echo - Backend:  http://localhost:8000 (API Docs: http://localhost:8000/docs)
echo - Frontend: http://localhost:5173
echo.
pause
