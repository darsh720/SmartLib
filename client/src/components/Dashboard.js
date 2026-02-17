import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';

const Dashboard = () => {
    const [books, setBooks] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [admins, setAdmins] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const CHART_COLORS = [
        '#FF7043', '#4e73df', '#1cc88a', '#f6c23e', '#36b9cc', 
        '#a5a6ff', '#858796', '#ff85ad', '#71dd37', '#ff3e1d'
    ];

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                const [bRes, tRes, aRes] = await Promise.all([
                    axios.get('http://localhost:5000/api/books'),
                    axios.get('http://localhost:5000/api/transactions'),
                    axios.get('http://localhost:5000/api/admins')
                ]);
                setBooks(bRes.data);
                setTransactions(tRes.data);
                setAdmins(aRes.data);
            } catch (error) {
                console.error("Dashboard Sync Error:", error);
            }
        };
        fetchAllData();
    }, []);

    const generatePiePaths = (data, total) => {
        let cumulativePercent = 0;
        return data.map((item, index) => {
            const percent = item.count / (total || 1);
            const startX = Math.cos(2 * Math.PI * cumulativePercent);
            const startY = Math.sin(2 * Math.PI * cumulativePercent);
            cumulativePercent += percent;
            const endX = Math.cos(2 * Math.PI * cumulativePercent);
            const endY = Math.sin(2 * Math.PI * cumulativePercent);
            const largeArcFlag = percent > 0.5 ? 1 : 0;
            return { 
                ...item, 
                color: CHART_COLORS[index % CHART_COLORS.length], 
                path: `M 0 0 L ${startX} ${startY} A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY} Z` 
            };
        });
    };

    const rackPieData = useMemo(() => {
        const counts = {};
        books.forEach(b => { counts[b.rack_number] = (counts[b.rack_number] || 0) + 1; });
        const sortedRacks = Object.entries(counts).sort((a, b) => a[0] - b[0]);
        const data = sortedRacks.map(([label, count]) => ({ label: `Rack ${label}`, count }));
        return generatePiePaths(data, books.length);
    }, [books]);

    const adminPieData = useMemo(() => {
        const superCount = admins.filter(a => a.is_super_admin || a.role === 'superadmin').length;
        const regularCount = admins.length - superCount;
        const data = [
            { label: 'Super Admins', count: superCount },
            { label: 'Regular Admins', count: regularCount }
        ];
        return generatePiePaths(data, admins.length);
    }, [admins]);

    // FIXED LOGIC: Count by event dates
    const dailyData = useMemo(() => {
        // Count as 'Issued' if the book was given out on the selected date
        const issuedOnDay = transactions.filter(t => 
            new Date(t.issue_date).toLocaleDateString('en-CA') === selectedDate
        ).length;

        // Count as 'Returned' if the book was brought back on the selected date
        const returnedOnDay = transactions.filter(t => 
            t.return_date && new Date(t.return_date).toLocaleDateString('en-CA') === selectedDate
        ).length;

        // List both issued and returned events for the table
        const combinedList = transactions.filter(t => {
            const isIssueDay = new Date(t.issue_date).toLocaleDateString('en-CA') === selectedDate;
            const isReturnDay = t.return_date && new Date(t.return_date).toLocaleDateString('en-CA') === selectedDate;
            return isIssueDay || isReturnDay;
        });

        return { issued: issuedOnDay, returned: returnedOnDay, list: combinedList };
    }, [transactions, selectedDate]);

    return (
        <div className="main-content-inner">
            <div className="page-header-container">
                <h1 className="page-title">SmartLib Insights</h1>
            </div>
            
            <div className="dashboard-grid">
                <div className="stat-card card-orange">
                    <div className="stat-content">
                        <div className="stat-header">Total Books</div>
                        <div className="stat-value text-white">{books.length}</div>
                    </div>
                    <i className="bi bi-book stat-icon-bg"></i>
                </div>
                <div className="stat-card">
                    <div className="stat-content">
                        <div className="stat-header">Active Loans</div>
                        <div className="stat-value text-orange">
                            {transactions.filter(t => t.status === 'issued').length}
                        </div>
                    </div>
                    <i className="bi bi-arrow-repeat stat-icon-bg"></i>
                </div>
                <div className="stat-card">
                    <div className="stat-content">
                        <div className="stat-header">System Admins</div>
                        <div className="stat-value text-blue">{admins.length}</div>
                    </div>
                    <i className="bi bi-shield-check stat-icon-bg"></i>
                </div>
            </div>

            <div className="charts-main-grid">
                <div className="chart-card">
                    <h3 className="chart-title"><i className="bi bi-pie-chart"></i> Books per Rack</h3>
                    <div className="pie-container">
                        <svg viewBox="-1 -1 2 2" className="pie-svg">
                            {rackPieData.map((s, i) => <path key={i} d={s.path} fill={s.color} />)}
                        </svg>
                        <div className="pie-legend">
                            {rackPieData.map((s, i) => (
                                <div key={i} className="legend-item">
                                    <span className="dot" style={{background: s.color}}></span>
                                    <span>{s.label}: <b>{s.count}</b></span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="chart-card">
                    <h3 className="chart-title"><i className="bi bi-person-badge"></i> Admin Roles</h3>
                    <div className="pie-container">
                        <svg viewBox="-1 -1 2 2" className="pie-svg">
                            {adminPieData.map((s, i) => <path key={i} d={s.path} fill={s.color} />)}
                        </svg>
                        <div className="pie-legend">
                            {adminPieData.map((s, i) => (
                                <div key={i} className="legend-item">
                                    <span className="dot" style={{background: s.color}}></span>
                                    <span>{s.label}: <b>{s.count}</b></span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="chart-card transaction-focus">
                    <div className="chart-header-flex">
                        <h3 className="chart-title"><i className="bi bi-calendar-check"></i> Transactions</h3>
                        <input 
                            type="date" 
                            className="date-picker-input" 
                            value={selectedDate} 
                            onChange={(e) => setSelectedDate(e.target.value)} 
                        />
                    </div>
                    <div className="transaction-stats-row">
                        <div className="t-stat">
                            <span className="t-label">Issued</span>
                            <span className="t-count text-orange">{dailyData.issued}</span>
                        </div>
                        <div className="t-stat">
                            <span className="t-label">Returned</span>
                            <span className="t-count text-blue">{dailyData.returned}</span>
                        </div>
                    </div>
                    <div className="mini-table-container">
                        <table className="mini-table">
                            <thead><tr><th>Borrower</th><th>Status</th></tr></thead>
                            <tbody>
                                {dailyData.list.length > 0 ? dailyData.list.map(t => (
                                    <tr key={t.id}>
                                        <td>{t.employee_name}</td>
                                        <td>
                                            {/* Logic to show correct status for the specific day */}
                                            <span className={`status-pill ${
                                                t.return_date && new Date(t.return_date).toLocaleDateString('en-CA') === selectedDate 
                                                ? 'returned' : 'issued'
                                            }`}>
                                                {t.return_date && new Date(t.return_date).toLocaleDateString('en-CA') === selectedDate 
                                                ? 'returned' : 'issued'}
                                            </span>
                                        </td>
                                    </tr>
                                )) : <tr><td colSpan="2" className="text-center text-sub">No activity today</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;