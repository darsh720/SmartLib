import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Dashboard = () => {
    const [stats, setStats] = useState({ totalBooks: 0, issuedBooks: 0, overdue: 0 });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const booksRes = await axios.get('http://192.168.31.68:5000/api/books');
                const transRes = await axios.get('http://192.168.31.68:5000/api/transactions');
                
                const total = booksRes.data.length;
                const issued = transRes.data.filter(t => t.status === 'issued').length;
                const today = new Date();
                const overdue = transRes.data.filter(t => t.status === 'issued' && new Date(t.due_date) < today).length;

                setStats({ totalBooks: total, issuedBooks: issued, overdue });
            } catch (error) {
                console.error("Error fetching stats");
            }
        };
        fetchStats();
    }, []);

    return (
        <div className="fade-in">
            <h1 className="section-title">Overview</h1>
            
            {/* Stats Grid */}
            <div className="dashboard-grid">
                {/* Highlight Card (Orange) */}
                <div className="stat-card card-orange">
                    <div>
                        <div className="stat-header">Total Books</div>
                        <div className="stat-value">{stats.totalBooks}</div>
                    </div>
                    <i className="bi bi-journal-bookmark stat-icon-bg" style={{opacity: 0.2}}></i>
                </div>

                {/* Standard White Cards */}
                <div className="stat-card">
                    <div>
                        <div className="stat-header">Active Loans</div>
                        <div className="stat-value text-orange">{stats.issuedBooks}</div>
                    </div>
                    <i className="bi bi-people stat-icon-bg"></i>
                </div>

                <div className="stat-card">
                    <div>
                        <div className="stat-header">Overdue Items</div>
                        <div className="stat-value text-red">{stats.overdue}</div>
                    </div>
                    <i className="bi bi-exclamation-circle stat-icon-bg"></i>
                </div>
            </div>

            {/* Quick Actions / Table Area */}
            <div className="table-card">
                <div className="table-header-row">
                    <h3 style={{margin:0, fontSize: '1.2rem'}}>Recent Activity</h3>
                    <button className="btn-primary" style={{padding:'8px 16px', fontSize:'0.8rem'}}>View All</button>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Activity</th>
                            <th>Status</th>
                            <th>Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>New Book Added</td>
                            <td><span className="status available">Success</span></td>
                            <td>10 mins ago</td>
                        </tr>
                        <tr>
                            <td>Book Issued to John</td>
                            <td><span className="status out">Pending</span></td>
                            <td>2 hours ago</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Dashboard;