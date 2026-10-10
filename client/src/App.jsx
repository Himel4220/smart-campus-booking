import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <Router>
      <header className="navbar">
        <Link to="/" className="brand-title">
          <span>🏛️</span> Smart Campus Booking
        </Link>
        <nav className="nav-links">
          <Link to="/">Public Schedule</Link>
          {user ? (
            <>
              <Link to="/dashboard">Dashboard</Link>
              <span className="user-badge">{user.role.replace('_', ' ')}</span>
              <button className="btn btn-logout" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register" className="btn" style={{ color: '#fff' }}>Register</Link>
            </>
          )}
        </nav>
      </header>

      <main className="app-container">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<Dashboard user={user} />} />
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </main>
    </Router>
  );
}