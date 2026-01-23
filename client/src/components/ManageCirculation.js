import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ManageCirculation = () => {
    // --- State ---
    const [transactions, setTransactions] = useState([]);
    const [books, setBooks] = useState([]);
    const [showIssue, setShowIssue] = useState(false);
    const [showEdit, setShowEdit] = useState(false);

    // Initial State for Forms
    const initialFormState = {
        book_id: '',
        b_no: '', 
        issue_date: new Date().toISOString().split('T')[0], 
        employee_name: '',
        employee_number: '',
        employee_email: '',
        employee_phone: ''
    };

    const [issueForm, setIssueForm] = useState(initialFormState);
    const [editForm, setEditForm] = useState({ ...initialFormState, id: '' });

    // --- Fetch Data ---
    useEffect(() => {
        fetchData();
        fetchBooks();
    }, []);

    const fetchData = async () => {
        try {
            const res = await axios.get('http://192.168.31.68:5000/api/transactions');
            setTransactions(res.data);
        } catch (err) { console.error("Error fetching transactions", err); }
    };

    const fetchBooks = async () => {
        try {
            const res = await axios.get('http://192.168.31.68:5000/api/books');
            setBooks(res.data);
        } catch (err) { console.error("Error fetching books", err); }
    };

    // --- Helper: Group Books by Rack ---
    const getBooksByRack = () => {
        const grouped = {};
        books.forEach(book => {
            const rack = book.rack_number || "Unassigned";
            if (!grouped[rack]) grouped[rack] = [];
            grouped[rack].push(book);
        });
        return grouped;
    };
    const booksByRack = getBooksByRack();

    // --- Handlers ---
    const handleIssueSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://192.168.31.68:5000/api/issue', issueForm);
            alert('Book Issued Successfully');
            setShowIssue(false);
            setIssueForm(initialFormState);
            fetchData();
        } catch (err) { 
            console.error(err);
            alert('Error issuing book'); 
        }
    };

    const openEditModal = (t) => {
        setEditForm({
            id: t.id,
            book_id: t.book_id,
            b_no: t.b_no || '',
            issue_date: t.date_of_issue ? new Date(t.date_of_issue).toISOString().split('T')[0] : '',
            employee_name: t.employee_name,
            employee_number: t.employee_number || '', 
            employee_email: t.employee_email,
            employee_phone: t.employee_phone || ''
        });
        setShowEdit(true);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`http://192.168.31.68:5000/api/transactions/update/${editForm.id}`, editForm);
            alert('Transaction Updated');
            setShowEdit(false);
            fetchData();
        } catch (err) { alert('Error updating transaction'); }
    };

    const handleReturn = async (id, book_id) => {
        if (window.confirm("Mark this book as returned?")) {
            try {
                await axios.post('http://192.168.31.68:5000/api/return', { transaction_id: id, book_id });
                fetchData();
            } catch (err) { alert('Error returning book'); }
        }
    };

    return (
        <div className="fade-in">
            {/* --- Header Section --- */}
            <div className="page-header-container">
                <div>
                    <h2 className="page-title">Circulation</h2>
                    <p className="page-subtitle">Manage issues, returns, and history</p>
                </div>
                <button className="btn-primary" onClick={() => setShowIssue(true)}>
                    <i className="bi bi-journal-plus me-2"></i> Issue New Book
                </button>
            </div>

            {/* --- Professional Table --- */}
            <div className="table-card">
                <table>
                    <thead>
                        <tr>
                            <th>Employee Details</th>
                            <th>Book Details</th>
                            <th>Dates</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map(t => (
                            <tr key={t.id}>
                                <td>
                                    <div className="text-bold">{t.employee_name}</div>
                                    <div className="text-sub">{t.employee_email}</div>
                                    <div className="text-sub">{t.employee_phone}</div>
                                </td>
                                <td>
                                    <div className="text-bold text-blue">{t.book_name}</div>
                                    <div className="text-sub">B. No: {t.b_no || 'N/A'}</div>
                                </td>
                                <td>
                                    <div className="text-sub">Issued: {new Date(t.date_of_issue || t.issue_date).toLocaleDateString()}</div>
                                    <div className="text-sub text-red">Due: {new Date(t.date_of_submit || t.due_date).toLocaleDateString()}</div>
                                </td>
                                <td>
                                    {t.status === 'issued'
                                        ? <span className="status out">Issued</span>
                                        : <span className="status available">Returned</span>
                                    }
                                </td>
                                <td>
                                    {t.status === 'issued' && (
                                        <>
                                            <button className="action-btn btn-edit" onClick={() => openEditModal(t)}>
                                                <i className="bi bi-pencil-fill"></i>
                                            </button>
                                            <button className="action-btn btn-delete" onClick={() => handleReturn(t.id, t.book_id)}>
                                                <i className="bi bi-arrow-return-left"></i>
                                            </button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* --- ISSUE BOOK MODAL --- */}
            {showIssue && (
                <div className="modal-overlay" onClick={() => setShowIssue(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{maxWidth: '700px'}}>
                        <div className="modal-header">
                            <h3 className="modal-title">Issue Book</h3>
                            <button className="close-modal" onClick={() => setShowIssue(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleIssueSubmit}>
                            {/* Row 1 */}
                            <div className="input-group">
                                <div className="input-wrapper">
                                    <label>Select Book (Grouped by Rack)</label>
                                    <select 
                                        value={issueForm.book_id} 
                                        onChange={e => setIssueForm({...issueForm, book_id: e.target.value})} 
                                        required
                                    >
                                        <option value="">-- Choose Book --</option>
                                        {Object.keys(booksByRack).map(rack => (
                                            <optgroup key={rack} label={`Rack No: ${rack}`}>
                                                {booksByRack[rack].map(b => (
                                                    <option key={b.id} value={b.id} disabled={b.available_count < 1}>{b.book_name} (Avail: {b.available_count})</option>
                                                ))}
                                            </optgroup>
                                        ))}
                                    </select>
                                </div>
                                <div className="input-wrapper">
                                    <label>Date of Issue</label>
                                    <input type="date" value={issueForm.issue_date} onChange={e => setIssueForm({...issueForm, issue_date: e.target.value})} required />
                                </div>
                            </div>

                            {/* Row 2 */}
                            <div className="input-group">
                                <div className="input-wrapper">
                                    <label>B. No (Accession)</label>
                                    <input placeholder="e.g. BK-2023-001" value={issueForm.b_no} onChange={e => setIssueForm({...issueForm, b_no: e.target.value})} required />
                                </div>
                                <div className="input-wrapper">
                                    <label>Employee Name</label>
                                    <input placeholder="Full Name" value={issueForm.employee_name} onChange={e => setIssueForm({...issueForm, employee_name: e.target.value})} required />
                                </div>
                            </div>

                            {/* Row 3 */}
                            <div className="input-group">
                                <div className="input-wrapper">
                                    <label>Employee ID</label>
                                    <input placeholder="EMP-001" value={issueForm.employee_number} onChange={e => setIssueForm({...issueForm, employee_number: e.target.value})} required />
                                </div>
                                <div className="input-wrapper">
                                    <label>Phone Number</label>
                                    <input placeholder="+91 98765..." value={issueForm.employee_phone} onChange={e => setIssueForm({...issueForm, employee_phone: e.target.value})} required />
                                </div>
                            </div>

                            {/* Row 4 */}
                            <div className="input-group">
                                <div className="input-wrapper">
                                    <label>Email Address</label>
                                    <input type="email" placeholder="mail@company.com" value={issueForm.employee_email} onChange={e => setIssueForm({...issueForm, employee_email: e.target.value})} required />
                                </div>
                            </div>

                            <button className="btn-primary" style={{ width: '100%', marginTop: '15px' }}>Confirm Issue</button>
                        </form>
                    </div>
                </div>
            )}

            {/* --- EDIT MODAL --- */}
            {showEdit && (
                <div className="modal-overlay" onClick={() => setShowEdit(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{maxWidth: '700px'}}>
                        <div className="modal-header">
                            <h3 className="modal-title">Edit Transaction</h3>
                            <button className="close-modal" onClick={() => setShowEdit(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleEditSubmit}>
                            <div className="input-group">
                                <div className="input-wrapper">
                                    <label>Employee Name</label>
                                    <input value={editForm.employee_name} onChange={e => setEditForm({...editForm, employee_name: e.target.value})} required />
                                </div>
                                <div className="input-wrapper">
                                    <label>B. No</label>
                                    <input value={editForm.b_no} onChange={e => setEditForm({...editForm, b_no: e.target.value})} required />
                                </div>
                            </div>
                            <div className="input-group">
                                <div className="input-wrapper">
                                    <label>Phone Number</label>
                                    <input value={editForm.employee_phone} onChange={e => setEditForm({...editForm, employee_phone: e.target.value})} required />
                                </div>
                                <div className="input-wrapper">
                                    <label>Email Address</label>
                                    <input value={editForm.employee_email} onChange={e => setEditForm({...editForm, employee_email: e.target.value})} required />
                                </div>
                            </div>
                            <button className="btn-primary" style={{ width: '100%', marginTop: '15px' }}>Update Details</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageCirculation;