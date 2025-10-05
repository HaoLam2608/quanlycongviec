const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const duanRoutes = require('./routes/duanRoutes');

app.use(cors());

app.use(bodyParser.json());

// routes...
app.use('/auth', require('./routes/authRoutes'));
app.use('/duan', duanRoutes);
app.use('/users', require('./routes/userRoutes'));
app.use('/roles', require('./routes/roleRoutes'));
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
