import React, { useState, useEffect } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import "jspdf-autotable";
import autoTable from 'jspdf-autotable';

const ManageBooks = () => {
  const [books, setBooks] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const [createForm, setCreateForm] = useState({
    book_name: "",
    rack_number: "",
    count: 1,
  });
  const [editForm, setEditForm] = useState({
    id: "",
    book_name: "",
    rack_number: "",
    count: 1,
  });

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/books");
      setBooks(res.data);
    } catch (err) {
      console.error("Error fetching books:", err);
    }
  };

  // --- Download Functions ---
  // Remove this line from the top:
  // import { Parser } from 'json2csv';

  const downloadCSV = () => {
    try {
      // Define headers
      const headers = ["Book Title", "Rack Number", "Available Count"];

      // Map the data rows
      const rows = books.map((book) => [
        `"${book.book_name}"`, // Wrap in quotes to handle titles with commas
        `"${book.rack_number}"`,
        book.available_count,
      ]);

      // Combine headers and rows into a single string
      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.join(",")),
      ].join("\n");

      // Create a download link and trigger it
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "SmartLib_Inventory.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("CSV Download Error:", err);
      alert("Failed to generate CSV file.");
    }
  };

  const downloadPDF = () => {
    try {
      const doc = new jsPDF();

      // Add Title
      doc.setFontSize(18);
      doc.text("SmartLib Inventory Report", 14, 22);
      doc.setFontSize(11);
      doc.setTextColor(100);

      // Add Date of Report
      const reportDate = new Date().toLocaleDateString();
      doc.text(`Report Generated: ${reportDate}`, 14, 30);

      const tableColumn = ["Book Title", "Rack No.", "Stock Status"];
      const tableRows = [];

      books.forEach((book) => {
        const bookData = [
          book.book_name,
          book.rack_number,
          book.available_count > 0
            ? `Available (${book.available_count})`
            : "Empty",
        ];
        tableRows.push(bookData);
      });

      // Use the imported autoTable function directly
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 35,
        theme: "striped",
        headStyles: { fillColor: [255, 112, 67] }, // Uses your SmartLib Orange
        margin: { top: 35 },
      });

      doc.save(`SmartLib_Inventory_${new Date().getTime()}.pdf`);
    } catch (err) {
      console.error("PDF Download Error:", err);
      alert("Failed to generate PDF file.");
    }
  };

  // --- Standard Handlers (Keep your existing handlers) ---
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/books", createForm);
      alert("Book Added Successfully");
      setShowCreate(false);
      setCreateForm({ book_name: "", rack_number: "", count: 1 });
      fetchBooks();
    } catch (err) {
      alert("Error adding book");
    }
  };

  const openEditModal = (book) => {
    setEditForm({
      id: book.id,
      book_name: book.book_name,
      rack_number: book.rack_number,
      count: book.available_count,
    });
    setShowEdit(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        `http://localhost:5000/api/books/update/${editForm.id}`,
        editForm,
      );
      alert("Book Updated Successfully");
      setShowEdit(false);
      fetchBooks();
    } catch (err) {
      alert("Error updating book");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this book?")) {
      try {
        await axios.delete(`http://localhost:5000/api/books/delete/${id}`);
        fetchBooks();
      } catch (err) {
        alert("Delete failed");
      }
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header-container">
        <div>
          <h2 className="page-title">Inventory</h2>
          <p className="page-subtitle">Manage books in SmartLib</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            className="btn-primary"
            onClick={downloadCSV}
            style={{ background: "#4e73df" }}
          >
            <i className="bi bi-file-earmark-spreadsheet"></i> CSV
          </button>
          <button
            className="btn-primary"
            onClick={downloadPDF}
            style={{ background: "#e74a3b" }}
          >
            <i className="bi bi-file-earmark-pdf"></i> PDF
          </button>
          <button className="btn-primary" onClick={() => setShowCreate(true)}>
            + Add Book
          </button>
        </div>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Book Title</th>
              <th>Rack No.</th>
              <th>Stock Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {books.map((b) => (
              <tr key={b.id}>
                <td className="text-bold">{b.book_name}</td>
                <td>{b.rack_number}</td>
                <td>
                  {b.available_count > 0 ? (
                    <span className="status available">
                      Available ({b.available_count})
                    </span>
                  ) : (
                    <span className="status out">Empty</span>
                  )}
                </td>
                <td>
                  <button
                    className="action-btn btn-edit"
                    onClick={() => openEditModal(b)}
                  >
                    <i className="bi bi-pencil-fill"></i>
                  </button>
                  <button
                    className="action-btn btn-delete"
                    onClick={() => handleDelete(b.id)}
                  >
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
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">New Entry</h3>
            <form onSubmit={handleCreateSubmit}>
              <div className="input-group">
                <div className="input-wrapper">
                  <label>Book Title</label>
                  <input
                    value={createForm.book_name}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        book_name: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>
              <div className="input-group">
                <div className="input-wrapper">
                  <label>Rack</label>
                  <input
                    value={createForm.rack_number}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        rack_number: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="input-wrapper">
                  <label>Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={createForm.count}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, count: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <button className="btn-primary" style={{ width: "100%" }}>
                Add to Library
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT MODAL --- */}
      {showEdit && (
        <div className="modal-overlay" onClick={() => setShowEdit(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Edit {editForm.book_name}</h3>
            <form onSubmit={handleEditSubmit}>
              <div className="input-group">
                <div className="input-wrapper">
                  <label>Book Title</label>
                  <input
                    value={editForm.book_name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, book_name: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <div className="input-group">
                <div className="input-wrapper">
                  <label>Rack</label>
                  <input
                    value={editForm.rack_number}
                    onChange={(e) =>
                      setEditForm({ ...editForm, rack_number: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="input-wrapper">
                  <label>Current Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.count}
                    onChange={(e) =>
                      setEditForm({ ...editForm, count: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <button className="btn-primary" style={{ width: "100%" }}>
                Update Entry
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageBooks;
