import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ManageBooks = () => {
    // --- State ---
    const [books, setBooks] = useState([]);
    const [showCreate, setShowCreate] = useState(false);
    const [showEdit, setShowEdit] = useState(false);

    // Form States
    const [createForm, setCreateForm] = useState({ book_name: '', author: '', rack_number: '', count: 1 });
    const [editForm, setEditForm] = useState({ id: '', book_name: '', author: '', rack_number: '', count: 1 });

    // --- Fetch Data ---
    useEffect(() => { fetchBooks(); }, []);

    const fetchBooks = async () => {
        try {
            const res = await axios.get('http://192.168.31.68:5000/api/books');
            setBooks(res.data);
        } catch (err) { console.error("Error fetching books:", err); }
    };

    // --- Create Handler ---
    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://192.168.31.68:5000/api/books', createForm);
            alert('Book Added Successfully');
            setShowCreate(false);
            setCreateForm({ book_name: '', author: '', rack_number: '', count: 1 });
            fetchBooks();
        } catch (err) { alert('Error adding book'); }
    };

    // --- Edit Handlers ---
    const openEditModal = (book) => {
        setEditForm({
            id: book.id,
            book_name: book.book_name,
            author: book.author,
            rack_number: book.rack_number,
            count: book.book_count || book.total_count || 1
        });
        setShowEdit(true);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`http://192.168.31.68:5000/api/books/update/${editForm.id}`, editForm);
            alert('Book Updated Successfully');
            setShowEdit(false);
            fetchBooks();
        } catch (err) { alert('Error updating book'); }
    };

    // --- Delete Handler ---
    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this book?')) {
            try {
                await axios.delete(`http://192.168.31.68:5000/api/books/delete/${id}`);
                fetchBooks();
            } catch (err) { alert('Delete failed'); }
        }
    };

    return (
        <div className="fade-in">
            {/* Header Section (Responsive) */}
            <div className="page-header-container">
                <div>
                    <h2 className="page-title">Inventory</h2>
                    <p className="page-subtitle">Manage your library assets</p>
                </div>
                <button className="btn-primary" onClick={() => setShowCreate(true)}>
                    + Add New Book
                </button>
            </div>

            {/* Professional List Table (Responsive Scroll) */}
            <div className="table-card">
                <table>
                    <thead>
                        <tr>
                            <th>Book Details</th>
                            <th>Rack Number</th>
                            <th>Availability</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {books.map(b => (
                            <tr key={b.id}>
                                <td>
                                    <div className="text-bold">{b.book_name}</div>
                                    <div className="text-sub">{b.author}</div>
                                </td>
                                <td>
                                    <span style={{ background: '#F7FAFC', padding: '6px 10px', borderRadius: '8px', fontWeight: '500' }}>
                                        {b.rack_number}
                                    </span>
                                </td>
                                <td>
                                    {b.available_count > 0
                                        ? <span className="status available">In Stock ({b.available_count})</span>
                                        : <span className="status out">Out of Stock</span>
                                    }
                                </td>
                                <td>
                                    <button className="action-btn btn-edit" onClick={() => openEditModal(b)}>
                                        <i className="bi bi-pencil-fill"></i>
                                    </button>
                                    <button className="action-btn btn-delete" onClick={() => handleDelete(b.id)}>
                                        <i className="bi bi-trash-fill"></i>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* --- CREATE MODAL --- */}
            {showCreate && (
                <div className="modal-overlay" onClick={() => setShowCreate(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Add New Book</h3>
                            <button className="close-modal" onClick={() => setShowCreate(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleCreateSubmit}>
                            {/* Input Group automatically stacks on mobile via CSS */}
                            <div className="input-group">
                                <div className="input-wrapper">
                                    <label>Book Name</label>
                                    <input value={createForm.book_name} onChange={e => setCreateForm({ ...createForm, book_name: e.target.value })} required />
                                </div>
                            </div>
                            <div className="input-group">
                                <div className="input-wrapper">
                                    <label>Rack Number</label>
                                    <input value={createForm.rack_number} onChange={e => setCreateForm({ ...createForm, rack_number: e.target.value })} required />
                                </div>
                                <div className="input-wrapper">
                                    <label>Total Copies</label>
                                    <input type="number" min="1" value={createForm.count} onChange={e => setCreateForm({ ...createForm, count: e.target.value })} required />
                                </div>
                            </div>
                            <button className="btn-primary" style={{ width: '100%', marginTop: '15px' }}>Save Book</button>
                        </form>
                    </div>
                </div>
            )}

            {/* --- EDIT MODAL --- */}
            {showEdit && (
                <div className="modal-overlay" onClick={() => setShowEdit(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Edit Book Details</h3>
                            <button className="close-modal" onClick={() => setShowEdit(false)}>&times;</button>
                        </div>
                        <form onSubmit={handleEditSubmit}>
                            <div className="input-group">
                                <div className="input-wrapper">
                                    <label>Book Name</label>
                                    <input value={editForm.book_name} onChange={e => setEditForm({ ...editForm, book_name: e.target.value })} required />
                                </div>
                            </div>
                            <div className="input-group">
                                <div className="input-wrapper">
                                    <label>Rack Number</label>
                                    <input value={editForm.rack_number} onChange={e => setEditForm({ ...editForm, rack_number: e.target.value })} required />
                                </div>
                                <div className="input-wrapper">
                                    <label>Total Copies</label>
                                    <input type="number" min="1" value={editForm.count} onChange={e => setEditForm({ ...editForm, count: e.target.value })} required />
                                </div>
                            </div>
                            <button className="btn-primary" style={{ width: '100%', marginTop: '15px' }}>Update Book</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageBooks;