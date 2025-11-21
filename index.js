const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const duanRoutes = require('./routes/duanRoutes');
const userRoutes = require('./routes/userRoutes');
const taskRoutes = require('./routes/taskRoutes');
const documentRoutes = require('./routes/documentRoutes');
const multer = require('multer');
const path = require('path');

app.use(cors({
    origin: '*', // Chấp nhận request từ mọi nguồn
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // Chấp nhận các phương thức này
    allowedHeaders: '*', // Cho phép tất cả headers (including multipart boundary)
    credentials: true,
    exposedHeaders: ['Content-Range', 'X-Content-Range']
}));

// Log all incoming requests
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url} - Content-Type: ${req.headers['content-type'] || 'none'}`);
    next();
});

// Body parser middleware - only parse if NOT multipart/form-data
app.use((req, res, next) => {
    const contentType = req.headers['content-type'] || '';
    if (contentType.includes('multipart/form-data')) {
        // Skip body parsing for multipart - let multer handle it
        return next();
    }
    // Apply body parser for other content types
    if (contentType.includes('application/json')) {
        return bodyParser.json()(req, res, next);
    }
    if (contentType.includes('application/x-www-form-urlencoded')) {
        return bodyParser.urlencoded({ extended: true })(req, res, next);
    }
    next();
});

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// NOTE: switch to memory storage to keep file buffer in req.file.buffer
const storage = multer.memoryStorage();
const upload = multer({ storage });

// routes...
app.use('/auth', require('./routes/authRoutes'));
app.use('/public', require('./routes/publicRoutes')); // Public routes (no auth)
app.use('/duan', duanRoutes);
app.use('/users', (req, res, next) => { req.upload = upload; next(); }, require('./routes/userRoutes'));
app.use('/roles', require('./routes/roleRoutes'));
app.use('/groups', require('./routes/groupRoutes'));
// settings routes
app.use('/settings', require('./routes/settingsRoutes'));
// mount document routes with upload middleware for /upload
app.use('/documents', (req, res, next) => { req.upload = upload; next(); }, documentRoutes);
// member routes
app.use('/members', require('./routes/memberRoutes'));
// notification routes
app.use('/notifications', require('./routes/notificationRoutes'));
// comment routes (comments about employees) - with request logging
app.use('/comments', (req, res, next) => {
    console.log(`📨 Comment route: ${req.method} ${req.url}`);
    console.log('📨 Content-Type:', req.headers['content-type']);
    next();
}, require('./routes/commentRoutes'));
// assignment routes (propose/accept/decline)
app.use('/assignments', require('./routes/assignmentRoutes'));
// approval routes (for task/subtask completion approval)
app.use('/approvals', require('./routes/approvalRoutes'));


// Health / root route
app.get('/', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});
app.use('/tasks', taskRoutes);
app.use('/worklogs', require('./routes/worklogRoutes'));
app.use('/reports', require('./routes/reportRoutes'));

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`📱 Mobile (Android Emulator): http://10.0.2.2:${PORT}`);
    console.log(`📱 Mobile (iOS Simulator): http://localhost:${PORT}`);
    console.log(`📱 Mobile (Real Device): http://<YOUR_IP>:${PORT}`);

    // Start deadline notification scheduler
    const { startDeadlineScheduler } = require('./services/deadlineNotificationScheduler');
    startDeadlineScheduler();
});
