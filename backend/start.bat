@echo off
echo Starting Agentic REEB AI Backend...
echo.

REM Create .env if it doesn't exist
if not exist .env (
    copy .env.example .env
    echo Created .env file from template
)

REM Install dependencies
echo Installing dependencies...
python -m pip install -r requirements.txt

REM Seed demo data
echo Seeding demo data...
python seed_data.py

REM Start server
echo.
echo Starting server on http://localhost:8000
echo Press Ctrl+C to stop
echo.
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
