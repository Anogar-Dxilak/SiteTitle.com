# 🔍 Sherlock — OSINT Social Media Finder

<div align="center">

**Advanced OSINT tool for discovering social media profiles by username or face photo.**

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)

</div>

---

## ✨ Features

### 🔎 Username Search
- Search across **10 major platforms** simultaneously
- Real-time results via WebSocket
- Concurrent async requests for speed
- Profile info extraction (name, bio, avatar, followers)

### 📷 Face Search
- **Yandex reverse image search** integration
- Drag & drop photo upload
- Results with thumbnails and source links

### 🎨 Premium UI
- Cyber Detective dark theme
- Glassmorphism design with neon accents
- Particle animations background
- Smooth Framer Motion transitions
- Fully responsive

### Supported Platforms

| Platform | Method | Info Extraction |
|----------|--------|----------------|
| 📷 Instagram | HTTP Profile Check | ✅ Name, Bio, Avatar |
| 🐦 Twitter/X | HTTP Profile Check | ✅ Name, Bio, Avatar |
| 📘 Facebook | HTTP Profile Check | ✅ Name, Bio, Avatar |
| 💼 LinkedIn | HTTP Profile Check | ✅ Name, Bio |
| 🎵 TikTok | HTTP Profile Check | ✅ Name, Bio, Avatar |
| ▶️ YouTube | HTTP Profile Check | ✅ Name, Bio, Avatar |
| 🐙 GitHub | Public API | ✅ Name, Bio, Avatar, Followers |
| 🤖 Reddit | JSON API | ✅ Name, Bio, Avatar, Followers |
| ✈️ Telegram | t.me Check | ✅ Name, Bio, Avatar, Members |
| 🎮 Discord | Limited Check | ⚠️ Basic |

---

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+**
- **Python 3.11+**

### 1. Backend Setup

```bash
cd backend

# Create virtual environment (recommended)
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Copy and configure environment
copy .env.example .env

# Start the server
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

### 3. Open the App

Navigate to `http://localhost:5173` in your browser.

---

## 🏗️ Architecture

```
┌──────────────────┐     ┌──────────────────────┐
│                  │     │                      │
│  React + Vite    │────▶│  FastAPI Backend      │
│  (Port 5173)     │     │  (Port 8000)          │
│                  │     │                      │
│  • Dashboard     │     │  • REST API           │
│  • Search Page   │     │  • WebSocket          │
│  • History Page  │     │  • Platform Checkers  │
│                  │     │  • Face Search Engine │
└──────────────────┘     └──────────┬───────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
               ┌────▼────┐  ┌─────▼─────┐  ┌─────▼─────┐
               │ 10 Social│  │  Yandex   │  │  Rate     │
               │ Media    │  │  Reverse  │  │  Limiter  │
               │ Platforms│  │  Image    │  │           │
               └──────────┘  └───────────┘  └───────────┘
```

---

## ⚖️ Legal Disclaimer

> **⚠️ This tool is for educational and research purposes only.**
>
> - Only searches for publicly available information
> - Do not use for harassment, stalking, or any illegal activity
> - Respect platform Terms of Service
> - Comply with GDPR, KVKK, and local privacy laws
> - The developers are not responsible for misuse

---

## 📄 License

MIT License — See [LICENSE](LICENSE) for details.
