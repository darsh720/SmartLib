const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// --- DATABASE CONNECTION ---
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', // Enter your MySQL password here
    database: 'library_pro_db'
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err.stack);
        return;
    }
    console.log('Connected to MySQL Database.');
});

const SECRET_KEY = "my_secret_key";

// ==========================================
// 1. AUTHENTICATION
// ==========================================
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.query('SELECT * FROM admins WHERE username = ? AND password = ?', [username, password], (err, results) => {
        if (err) return res.status(500).send(err);
        if (results.length > 0) {
            const token = jwt.sign({ id: results[0].id, role: 'admin' }, SECRET_KEY, { expiresIn: '24h' });
            res.json({ token, user: results[0] });
        } else {
            res.status(401).json({ message: "Invalid Credentials" });
        }
    });
});

// ==========================================
// 2. BOOK MANAGEMENT (With Rack & Author)
// ==========================================

// GET: Fetch all books
app.get('/api/books', (req, res) => {
    // We select * to get rack_number, author, available_count
    db.query('SELECT * FROM books ORDER BY id DESC', (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// POST: Add a new book
app.post('/api/books', (req, res) => {
    const { book_name, author, rack_number, count } = req.body;
    
    const sql = "INSERT INTO books (book_name, author, rack_number, total_count, available_count) VALUES (?, ?, ?, ?, ?)";
    
    // We set both total_count and available_count to 'count' initially
    db.query(sql, [book_name, author, rack_number, count, count], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send(err);
        }
        res.json({ message: "Book Added Successfully" });
    });
});

// PUT: Update an existing book
app.put('/api/books/update/:id', (req, res) => {
    const bookId = req.params.id;
    const { book_name, author, rack_number, count } = req.body;

    // Note: Updating 'available_count' directly might require logic to check issued books. 
    // For simplicity, we strictly update fields passed.
    const sql = `UPDATE books SET 
                 book_name = ?, 
                 author = ?, 
                 rack_number = ?, 
                 total_count = ?,
                 available_count = ? -- Be careful updating this if books are issued!
                 WHERE id = ?`;

    db.query(sql, [book_name, author, rack_number, count, count, bookId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send(err);
        }
        res.json({ message: "Book Updated Successfully" });
    });
});

// DELETE: Delete a book
app.delete('/api/books/delete/:id', (req, res) => {
    const bookId = req.params.id;
    const sql = "DELETE FROM books WHERE id = ?";
    db.query(sql, [bookId], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ message: "Book Deleted Successfully" });
    });
});

// ==========================================
// 3. CIRCULATION (ISSUE, EDIT, RETURN)
// ==========================================

// GET: Fetch Transactions
app.get('/api/transactions', (req, res) => {
    const sql = `
        SELECT t.*, b.book_name, b.rack_number
        FROM transactions t 
        JOIN books b ON t.book_id = b.id 
        ORDER BY t.issue_date DESC`;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// POST: Issue Book
app.post('/api/issue', (req, res) => {
    const { 
        book_id, 
        b_no, 
        issue_date, 
        employee_name, 
        employee_number, // This comes from Frontend "Employee ID" input
        employee_email, 
        employee_phone 
    } = req.body;
    
    // Calculate Due Date (Issue Date + 10 Days)
    const start = new Date(issue_date);
    const due = new Date(start);
    due.setDate(start.getDate() + 10);

    // FIX: Ensure column names match your DB image exactly.
    // Based on image: col 5 is employee_number, col 8 is employee_id.
    // We will save the ID to 'employee_number' to be safe.
    const sqlTransaction = `
        INSERT INTO transactions 
        (book_id, b_no, employee_name, employee_number, employee_email, employee_phone, issue_date, due_date, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'issued')`;
    
    db.query(sqlTransaction, [book_id, b_no, employee_name, employee_number, employee_email, employee_phone, issue_date, due], (err, result) => {
        if (err) {
            console.error("Issue Error:", err);
            return res.status(500).send(err);
        }
        
        // Decrease Available Count in Books Table
        db.query("UPDATE books SET available_count = available_count - 1 WHERE id = ?", [book_id]);
        res.json({ message: "Book Issued Successfully" });
    });
});

// POST: Return Book (Pink Button Logic)
app.post('/api/return', (req, res) => {
    const { transaction_id, book_id } = req.body;
    
    // 1. Get Current Date/Time
    const now = new Date();
    // Format for MySQL DATETIME (YYYY-MM-DD HH:MM:SS)
    const returnDate = now.toISOString().slice(0, 19).replace('T', ' ');

    // 2. Update Transaction: Set Status='returned' and return_date
    const sql = "UPDATE transactions SET return_date = ?, status = 'returned' WHERE id = ?";
    
    db.query(sql, [returnDate, transaction_id], (err, result) => {
        if (err) {
            console.error("Return Error:", err);
            return res.status(500).send(err);
        }
        
        // 3. AUTOMATICALLY INCREASE BOOK COUNT
        db.query("UPDATE books SET available_count = available_count + 1 WHERE id = ?", [book_id]);
        
        res.json({ message: "Book Returned Successfully" });
    });
});

// ==========================================
// 4. EMAIL ALERTS
// ==========================================
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'darshanpatel4456@gmail.com', // Replace with your email
        pass: 'zmexnmxhuduclvif'      // Replace with your app password
    }
});

app.post('/api/send-alert', (req, res) => {
    const { transaction_id, email, book_name, due_date } = req.body;

    const mailOptions = {
        from: 'darshanpatel4456@gmail.com',
        to: email,
        subject: 'Library Book Due Reminder',
        text: `Hello, \n\nThe book "${book_name}" is due on ${new Date(due_date).toDateString()}. \nPlease return it to avoid any fines.\n\nThank You.`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
            return res.status(500).json({ message: "Failed to send email" });
        } else {
            db.query("UPDATE transactions SET email_alert_sent = TRUE WHERE id = ?", [transaction_id]);
            res.json({ message: "Email Sent Successfully" });
        }
    });
});

// ==========================================
// 5. ADMIN MANAGEMENT
// ==========================================

// GET: Fetch all admins
app.get('/api/admins', (req, res) => {
    // We select specific fields to avoid sending passwords back to frontend
    const sql = "SELECT id, full_name, email, username, created_at FROM admins ORDER BY id DESC";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

// POST: Create new admin
app.post('/api/admins', (req, res) => {
    const { full_name, email, username, password, sendEmail } = req.body;
    
    // 1. Check if username exists
    db.query("SELECT * FROM admins WHERE username = ?", [username], (err, results) => {
        if (err) return res.status(500).send(err);
        if (results.length > 0) return res.status(400).json({ message: "Username already exists" });

        // 2. Insert into Database
        const sql = "INSERT INTO admins (full_name, email, username, password) VALUES (?, ?, ?, ?)";
        db.query(sql, [full_name, email, username, password], (err, result) => {
            if (err) return res.status(500).send(err);

            // 3. Send Email if toggle was ON
            if (sendEmail) {
                const mailOptions = {
                    from: 'darshanpatel4456@gmail.com',
                    to: email,
                    subject: 'Welcome to Libra - Admin Access',
                    text: `Hello ${full_name},\n\nYou have been granted Admin access to the Libra Library Management System.\n\nHere are your login credentials:\nUsername: ${username}\nPassword: ${password}\n\nPlease login and change your password if necessary.\n\nRegards,\nLibra System`
                };

                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.log("Email error:", error);
                        // We still return success because the account was created, but log the email error
                    } else {
                        console.log("Welcome email sent:", info.response);
                    }
                });
            }

            res.json({ message: "Admin Created Successfully" });
        });
    });
});

// DELETE: Remove admin
app.delete('/api/admins/:id', (req, res) => {
    const id = req.params.id;
    const sql = "DELETE FROM admins WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ message: "Admin Deleted Successfully" });
    });
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));