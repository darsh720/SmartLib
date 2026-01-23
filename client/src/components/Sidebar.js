import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../App.css'; 

const Sidebar = ({ onLogout }) => {
    const location = useLocation();

    return (
        <div className="sidebar">
            <div className="logo-section">
                <i className="bi bi-book-half logo-icon"></i>
                <span>Libra</span>
            </div>
            
            {/* Nav container grows to fill space on desktop, horizontal on mobile */}
            <nav className="nav-section" style={{ flex: 1, overflowY: 'auto' }}>
                <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
                    <i className="bi bi-grid"></i> Dashboard
                </Link>
                <Link to="/books" className={`nav-link ${location.pathname === '/books' ? 'active' : ''}`}>
                    <i className="bi bi-collection"></i> Manage Books
                </Link>
                <Link to="/circulation" className={`nav-link ${location.pathname === '/circulation' ? 'active' : ''}`}>
                    <i className="bi bi-arrow-left-right"></i> Circulation
                </Link>
                <Link to="/admins" className={`nav-link ${location.pathname === '/admins' ? 'active' : ''}`}>
                    <i className="bi bi-shield-lock"></i> Manage Admins
                </Link>
            </nav>
            
            <button onClick={onLogout} className="logout-btn">
                <i className="bi bi-box-arrow-right"></i> <span className="logout-text">Logout</span>
            </button>
        </div>
    );
};

export default Sidebar;