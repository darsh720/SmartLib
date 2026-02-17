import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ManageAdmins = () => {
    const [admins, setAdmins] = useState([]);
    const [showCreate, setShowCreate] = useState(false);
    
    // Form State
    const [form, setForm] = useState({ full_name: '', email: '', username: '', password: '' });
    const [sendEmail, setSendEmail] = useState(true); 

    useEffect(() => { fetchAdmins(); }, []);

    const fetchAdmins = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/admins');
            setAdmins(res.data);
        } catch (err) { console.error(err); }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/api/admins', { ...form, sendEmail });
            alert('New Admin Created Successfully');
            setShowCreate(false);
            setForm({ full_name: '', email: '', username: '', password: '' });
            setSendEmail(true); 
            fetchAdmins();
        } catch (err) { alert('Error creating admin'); }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this admin?')) {
            try {
                await axios.delete(`http://localhost:5000/api/admins/${id}`);
                fetchAdmins();
            } catch (err) { alert('Error deleting admin'); }
        }
    };

    return (
        <div className="fade-in">
            <div className="page-header-container">
                <div>
                    <h2 className="page-title">Admin Management</h2>
                    <p className="page-subtitle">Control system access and roles</p>
                </div>
                <button className="btn-primary" onClick={() => setShowCreate(true)}>
                    + Add New Admin
                </button>
            </div>

            {/* Admin List Table */}
            <div className="table-card">
                <table>
                    <thead>
                        <tr>
                            <th>Admin Details</th>
                            <th>Username</th>
                            <th>Role / Access</th>
                            <th>Created At</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {admins.map(admin => (
                            <tr key={admin.id}>
                                <td>
                                    <div className="text-bold">{admin.full_name}</div>
                                    <div className="text-sub">{admin.email}</div>
                                </td>
                                <td><span style={{ background: '#F7FAFC', padding: '5px 10px', borderRadius: '8px', fontWeight: '500' }}>@{admin.username}</span></td>
                                <td><span className="status available">Full Access</span></td>
                                <td>{new Date(admin.created_at).toLocaleDateString()}</td>
                                <td>
                                    <button className="action-btn btn-delete" onClick={() => handleDelete(admin.id)}>
                                        <i className="bi bi-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Create Admin Modal */}
            {showCreate && (
                <div className="modal-overlay" onClick={() => setShowCreate(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Create New Admin</h3>
                            <button className="close-modal" onClick={() => setShowCreate(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleCreate}>
                            <div className="input-group">
                                <div className="input-wrapper">
                                    <label>Full Name</label>
                                    <input value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} required />
                                </div>
                            </div>
                            <div className="input-group">
                                <div className="input-wrapper">
                                    <label>Email Address</label>
                                    <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
                                </div>
                            </div>
                            <div className="input-group">
                                <div className="input-wrapper">
                                    <label>Username</label>
                                    <input value={form.username} onChange={e => setForm({...form, username: e.target.value})} required />
                                </div>
                                <div className="input-wrapper">
                                    <label>Password</label>
                                    <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
                                </div>
                            </div>

                            {/* Email Toggle Switch */}
                            <div className="checkbox-group">
                                <input 
                                    type="checkbox" 
                                    id="sendEmail" 
                                    className="checkbox-input"
                                    checked={sendEmail} 
                                    onChange={e => setSendEmail(e.target.checked)} 
                                />
                                <label htmlFor="sendEmail" className="checkbox-label">
                                    Send welcome email with credentials
                                </label>
                            </div>

                            <button className="btn-primary" style={{ width: '100%' }}>Create Account</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageAdmins;