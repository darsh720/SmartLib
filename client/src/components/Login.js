import React, { useState } from 'react';
import axios from 'axios';
// Ensure you have Bootstrap Icons link in your public/index.html head:
// <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css">

const Login = ({ setToken }) => {
    const [user, setUser] = useState('');
    const [pass, setPass] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('http://192.168.31.68:5000/api/login', { username: user, password: pass });
            localStorage.setItem('token', res.data.token);
            setToken(res.data.token);
        } catch (err) {
            alert('Invalid Credentials');
        }
    };

    return (
        <div className="login-page-container">
            {/* --- Left Side: Login Form --- */}
            <div className="login-form-container">
                <div className="login-form-content">
                    
                    {/* Logo & Title (Refactored to classes) */}
                    <div className="brand-header">
                        <i className="bi bi-book-half brand-icon"></i>
                        <h2 className="brand-name">Libra</h2>
                    </div>

                    <div className="login-header">
                        <h1 className="login-title">Log in to your Account</h1>
                        <p className="login-subtitle">Welcome back! Please enter your details.</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* Username Field */}
                        <div className="login-input-group">
                            <label htmlFor="username" className="login-input-label">Username</label>
                            <div className="input-with-icon-wrapper">
                                <i className="bi bi-person input-icon"></i>
                                <input
                                    id="username"
                                    className="login-input-field"
                                    type="text"
                                    placeholder="Enter your username"
                                    value={user}
                                    onChange={e => setUser(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="login-input-group">
                            <label htmlFor="password" className="login-input-label">Password</label>
                            <div className="input-with-icon-wrapper">
                                <i className="bi bi-lock input-icon"></i>
                                <input
                                    id="password"
                                    className="login-input-field"
                                    type="password"
                                    placeholder="••••••••"
                                    value={pass}
                                    onChange={e => setPass(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        
                        {/* Login Button */}
                        <button type="submit" className="login-button">Log In</button>
                    </form>
                </div>
            </div>

            {/* --- Right Side: Branding & Illustration --- */}
            <div className="login-branding-container">
                <div className="branding-content">
                    <i className="bi bi-diagram-3-fill branding-illustration-icon"></i>
                    
                    <h2 className="branding-title">Connect with your library.</h2>
                    <p className="branding-text">
                        Manage assets, track circulation, and connect with patrons through our comprehensive and easy-to-use dashboard.
                    </p>
                    
                    {/* Pagination dots */}
                    <div className="branding-dots">
                        <span className="dot active"></span>
                        <span className="dot"></span>
                        <span className="dot"></span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;