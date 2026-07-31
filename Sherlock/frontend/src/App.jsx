import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import Sidebar from './components/Layout/Sidebar';
import Navbar from './components/Layout/Navbar';
import AnimatedBackground from './components/Common/AnimatedBackground';

import Home from './pages/Home';
import SearchPage from './pages/SearchPage';
import HistoryPage from './pages/HistoryPage';

import './styles/index.css';
import './styles/components.css';

export default function App() {
  return (
    <Router>
      <div className="app-layout">
        <AnimatedBackground />
        <Sidebar />
        <div className="app-main">
          <Navbar />
          <Routes>
            {/* Opening localhost:5173 directly lands on Username Search */}
            <Route path="/" element={<SearchPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/dashboard" element={<Home />} />
            <Route path="/history" element={<HistoryPage />} />
          </Routes>
        </div>
      </div>
      <Toaster
        position="bottom-right"
        toastOptions={{
          className: 'toast-custom',
          duration: 3000,
          style: {
            background: '#0f0f0f',
            color: '#ffffff',
            border: '1px solid #1f2937',
            borderRadius: '10px',
            fontFamily: "ui-monospace, Consolas, 'JetBrains Mono', monospace",
            boxShadow: '0 0 15px rgba(0, 255, 102, 0.2)',
          },
        }}
      />
    </Router>
  );
}
