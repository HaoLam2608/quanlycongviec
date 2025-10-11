const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const duanRoutes = require('./routes/duanRoutes');
const userRoutes = require('./routes/userRoutes');
const documentRoutes = require('./routes/documentRoutes');
const multer = require('multer');
const path = require('path');

app.use(cors());

app.use(bodyParser.json());

// routes...
app.use('/auth', require('./routes/authRoutes'));
app.use('/duan', duanRoutes);
app.use('/users', require('./routes/userRoutes'));
app.use('/roles', require('./routes/roleRoutes'));
app.use('/groups', require('./routes/groupRoutes'));
// NOTE: switch to memory storage to keep file buffer in req.file.buffer
const storage = multer.memoryStorage();
const upload = multer({ storage });

// mount document routes with upload middleware for /upload
app.use('/documents', (req, res, next) => { req.upload = upload; next(); }, documentRoutes);

// Health / root route
app.get('/', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
