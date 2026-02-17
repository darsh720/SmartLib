import React, { useState } from 'react';
import axios from 'axios';

const Login = ({ setToken }) => {
    const [user, setUser] = useState('');
    const [pass, setPass] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('http://localhost:5000/api/login', { username: user, password: pass });
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
                    
                    <div className="brand-header">
                        <i className="bi bi-book-half brand-icon"></i>
                        <h2 className="brand-name">SmartLib</h2>
                    </div>

                    <div className="login-header">
                        <h1 className="login-title">Librarian Portal</h1>
                        <p className="login-subtitle">Access the central catalog and manage circulation.</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="login-input-group">
                            <label htmlFor="username" className="login-input-label">Staff ID or Username</label>
                            <div className="input-with-icon-wrapper">
                                <i className="bi bi-person-badge input-icon"></i>
                                <input
                                    id="username"
                                    className="login-input-field"
                                    type="text"
                                    placeholder="e.g. admin_01"
                                    value={user}
                                    onChange={e => setUser(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="login-input-group">
                            <label htmlFor="password" className="login-input-label">Security Password</label>
                            <div className="input-with-icon-wrapper">
                                <i className="bi bi-shield-lock input-icon"></i>
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
                        
                        <button type="submit" className="login-button">
                            Sign In to Dashboard <i className="bi bi-arrow-right"></i>
                        </button>
                    </form>
                    
                    <div className="login-footer">
                        <p>Trouble logging in? <a href="#" className="create-account-link">Contact IT Support</a></p>
                    </div>
                </div>
            </div>

            {/* --- Right Side: Branding/Visual --- */}
            <div className="login-branding-container">
                <div className="branding-content">
                    <div className="branding-illustration-wrapper">
                         <i className="bi bi-journals branding-illustration-icon"></i>
                    </div>
                    
                    <h2 className="branding-title">Smart Management for Modern Libraries.</h2>
                    <p className="branding-text">
                        From digital archiving to RFID tracking, SmartLib provides the tools to manage your entire collection in one unified space.
                    </p>
                    
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