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

app.use(cors());

app.use(bodyParser.json());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// NOTE: switch to memory storage to keep file buffer in req.file.buffer
const storage = multer.memoryStorage();
const upload = multer({ storage });

// routes...
app.use('/auth', require('./routes/authRoutes'));
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
// comment routes (comments about employees)
app.use('/comments', require('./routes/commentRoutes'));
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
});
