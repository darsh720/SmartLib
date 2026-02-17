import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ManageCirculation = () => {
    const [transactions, setTransactions] = useState([]);
    const [books, setBooks] = useState([]);
    const [showIssue, setShowIssue] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    
    const initialFormState = {
        book_id: '',
        b_no: '', 
        issue_date: new Date().toISOString().split('T')[0], 
        expected_return_date: '', 
        employee_name: '',
        employee_number: '',
        employee_email: '',
        employee_phone: ''
    };

    const [issueForm, setIssueForm] = useState(initialFormState);
    const [editForm, setEditForm] = useState({ ...initialFormState, id: '' });

    useEffect(() => {
        fetchData();
        fetchBooks();
    }, []);

    const fetchData = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/transactions');
            setTransactions(res.data);
        } catch (err) { console.error("Fetch Error:", err); }
    };

    const fetchBooks = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/books');
            setBooks(res.data);
        } catch (err) { console.error("Books Fetch Error:", err); }
    };

    // --- DOWNLOAD: CSV (Browser Native) ---
    const downloadCSV = () => {
        try {
            const headers = ['Borrower', 'ID', 'Book Name', 'B. No', 'Issue Date', 'Exp. Return', 'Status'];
            const rows = transactions.map(t => [
                `"${t.employee_name}"`,
                `"${t.employee_number}"`,
                `"${t.book_name}"`,
                `"${t.b_no}"`,
                new Date(t.issue_date).toLocaleDateString(),
                t.expected_return_date ? new Date(t.expected_return_date).toLocaleDateString() : 'N/A',
                t.status.toUpperCase()
            ]);
            const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `SmartLib_Circulation_${new Date().toLocaleDateString()}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) { console.error("CSV Export Error:", err); }
    };

    // --- DOWNLOAD: PDF (jspdf-autotable) ---
    const downloadPDF = () => {
        try {
            const doc = new jsPDF('l', 'mm', 'a4'); 
            doc.setFontSize(18);
            doc.text("SmartLib Circulation Report", 14, 15);
            doc.setFontSize(10);
            doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);

            const tableColumn = ["Borrower", "Book", "B. No", "Issue Date", "Exp. Return", "Status"];
            const tableRows = transactions.map(t => [
                t.employee_name,
                t.book_name,
                t.b_no,
                new Date(t.issue_date).toLocaleDateString(),
                t.expected_return_date ? new Date(t.expected_return_date).toLocaleDateString() : 'N/A',
                t.status.toUpperCase()
            ]);

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 28,
                theme: 'grid',
                headStyles: { fillColor: [255, 112, 67] },
                styles: { fontSize: 8 }
            });
            doc.save(`SmartLib_Circulation_${new Date().getTime()}.pdf`);
        } catch (err) { console.error("PDF Export Error:", err); }
    };

    const handleIssueSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/api/issue', issueForm);
            alert('Book Issued Successfully');
            setShowIssue(false);
            setIssueForm(initialFormState);
            fetchData();
        } catch (err) { alert('Error issuing book'); }
    };

    const openEditModal = (t) => {
        setEditForm({
            id: t.id,
            book_id: t.book_id,
            b_no: t.b_no || '',
            issue_date: t.issue_date ? new Date(t.issue_date).toISOString().split('T')[0] : '',
            expected_return_date: t.expected_return_date ? new Date(t.expected_return_date).toISOString().split('T')[0] : '',
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
            await axios.put(`http://localhost:5000/api/transactions/update/${editForm.id}`, editForm);
            alert('Transaction Updated');
            setShowEdit(false);
            fetchData();
        } catch (err) { alert('Error updating transaction'); }
    };

    const handleReturn = async (id, book_id) => {
        if (window.confirm("Mark this book as returned?")) {
            try {
                await axios.post('http://localhost:5000/api/return', { transaction_id: id, book_id });
                fetchData();
            } catch (err) { alert('Error returning book'); }
        }
    };

    const handleSendAlert = async (t) => {
        try {
            await axios.post('http://localhost:5000/api/send-alert', {
                transaction_id: t.id,
                email: t.employee_email,
                book_name: t.book_name,
                due_date: t.expected_return_date || t.due_date
            });
            alert("Reminder Email Sent!");
            fetchData();
        } catch (err) { alert("Failed to send email"); }
    };

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

    return (
        <div className="fade-in">
            <div className="page-header-container">
                <div>
                    <h2 className="page-title">Circulation</h2>
                    <p className="page-subtitle">Manage issues, track returns, and export logs</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn-primary" onClick={downloadCSV} style={{ background: '#4e73df' }}>
                        <i className="bi bi-file-earmark-spreadsheet"></i> CSV
                    </button>
                    <button className="btn-primary" onClick={downloadPDF} style={{ background: '#e74a3b' }}>
                        <i className="bi bi-file-earmark-pdf"></i> PDF
                    </button>
                    <button className="btn-primary" onClick={() => setShowIssue(true)}>
                        <i className="bi bi-journal-plus me-2"></i> Issue New Book
                    </button>
                </div>
            </div>

            <div className="table-card">
                <div className="responsive-table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Borrower</th>
                                <th>Book Details</th>
                                <th>Dates</th>
                                <th>Email Status</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map(t => (
                                <tr key={t.id}>
                                    <td>
                                        <div className="text-bold">{t.employee_name}</div>
                                        <div className="text-sub">ID: {t.employee_number}</div>
                                    </td>
                                    <td>
                                        <div className="text-bold text-blue">{t.book_name}</div>
                                        <div className="text-sub">B. No: {t.b_no}</div>
                                    </td>
                                    <td>
                                        <div className="text-sub">Issue: {new Date(t.issue_date).toLocaleDateString()}</div>
                                        <div className="text-sub text-orange">Exp. Return: {t.expected_return_date ? new Date(t.expected_return_date).toLocaleDateString() : 'N/A'}</div>
                                    </td>
                                    <td>
                                        {t.email_alert_sent ? 
                                            <span className="status available"><i className="bi bi-check-all"></i> Sent</span> : 
                                            <span className="status out">Not Sent</span>
                                        }
                                    </td>
                                    <td><span className={`status ${t.status}`}>{t.status}</span></td>
                                    <td>
                                        {t.status === 'issued' && (
                                            <div style={{display: 'flex', gap: '5px'}}>
                                                <button className="action-btn btn-edit" title="Edit" onClick={() => openEditModal(t)}>
                                                    <i className="bi bi-pencil"></i>
                                                </button>
                                                <button className="action-btn btn-primary" title="Send Reminder" onClick={() => handleSendAlert(t)} style={{background: '#EBF0FF', color: '#4E73DF'}}>
                                                    <i className="bi bi-envelope-at"></i>
                                                </button>
                                                <button className="action-btn btn-delete" title="Mark Return" onClick={() => handleReturn(t.id, t.book_id)}>
                                                    <i className="bi bi-arrow-return-left"></i>
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- ISSUE BOOK MODAL --- */}
            {showIssue && (
                <div className="modal-overlay" onClick={() => setShowIssue(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{maxWidth: '750px'}}>
                        <div className="modal-header">
                            <h3 className="modal-title">Issue Book</h3>
                            <button className="close-modal" onClick={() => setShowIssue(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleIssueSubmit}>
                            <div className="input-group">
                                <div className="input-wrapper">
                                    <label>Select Book</label>
                                    <select value={issueForm.book_id} onChange={e => setIssueForm({...issueForm, book_id: e.target.value})} required>
                                        <option value="">-- Choose Book --</option>
                                        {Object.keys(booksByRack).map(rack => (
                                            <optgroup key={rack} label={`Rack No: ${rack}`}>
                                                {booksByRack[rack].map(b => (
                                                    <option key={b.id} value={b.id} disabled={b.available_count < 1}>{b.book_name}</option>
                                                ))}
                                            </optgroup>
                                        ))}
                                    </select>
                                </div>
                                <div className="input-wrapper">
                                    <label>Expected Return Date</label>
                                    <input type="date" value={issueForm.expected_return_date} onChange={e => setIssueForm({...issueForm, expected_return_date: e.target.value})} required />
                                </div>
                            </div>
                            <div className="input-group">
                                <div className="input-wrapper">
                                    <label>B. No (Accession)</label>
                                    <input value={issueForm.b_no} onChange={e => setIssueForm({...issueForm, b_no: e.target.value})} required />
                                </div>
                                <div className="input-wrapper">
                                    <label>Issue Date</label>
                                    <input type="date" value={issueForm.issue_date} onChange={e => setIssueForm({...issueForm, issue_date: e.target.value})} required />
                                </div>
                            </div>
                            <div className="input-group">
                                <div className="input-wrapper">
                                    <label>Employee Name</label>
                                    <input value={issueForm.employee_name} onChange={e => setIssueForm({...issueForm, employee_name: e.target.value})} required />
                                </div>
                                <div className="input-wrapper">
                                    <label>Employee ID</label>
                                    <input value={issueForm.employee_number} onChange={e => setIssueForm({...issueForm, employee_number: e.target.value})} required />
                                </div>
                            </div>
                            <div className="input-group">
                                <div className="input-wrapper">
                                    <label>Email Address</label>
                                    <input type="email" value={issueForm.employee_email} onChange={e => setIssueForm({...issueForm, employee_email: e.target.value})} required />
                                </div>
                                <div className="input-wrapper">
                                    <label>Phone Number</label>
                                    <input value={issueForm.employee_phone} onChange={e => setIssueForm({...issueForm, employee_phone: e.target.value})} required />
                                </div>
                            </div>
                            <button className="btn-primary" style={{width:'100%', marginTop: '20px'}}>Confirm Issue</button>
                        </form>
                    </div>
                </div>
            )}

            {/* --- EDIT TRANSACTION MODAL --- */}
            {showEdit && (
                <div className="modal-overlay" onClick={() => setShowEdit(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{maxWidth: '750px'}}>
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
                                    <label>Expected Return Date</label>
                                    <input type="date" value={editForm.expected_return_date} onChange={e => setEditForm({...editForm, expected_return_date: e.target.value})} required />
                                </div>
                            </div>
                            <div className="input-group">
                                <div className="input-wrapper">
                                    <label>Email Address</label>
                                    <input type="email" value={editForm.employee_email} onChange={e => setEditForm({...editForm, employee_email: e.target.value})} required />
                                </div>
                                <div className="input-wrapper">
                                    <label>Phone Number</label>
                                    <input value={editForm.employee_phone} onChange={e => setEditForm({...editForm, employee_phone: e.target.value})} required />
                                </div>
                            </div>
                            <button className="btn-primary" style={{width:'100%', marginTop: '20px'}}>Update Transaction</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageCirculation;