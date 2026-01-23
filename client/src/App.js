import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ManageBooks from './components/ManageBooks';
import ManageCirculation from './components/ManageCirculation';
import Sidebar from './components/Sidebar';
import ManageAdmins from './components/ManageAdmins';
import './App.css';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Logout Function
  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  if (!token) {
    return <Login setToken={setToken} />;
  }

  return (
    <Router>
      <div className="app-container">
        <Sidebar onLogout={handleLogout} />
        <div className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/books" element={<ManageBooks />} />
            <Route path="/circulation" element={<ManageCirculation />} />
            <Route path="*" element={<Navigate to="/" />} />
            <Route path="/admins" element={<ManageAdmins />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;