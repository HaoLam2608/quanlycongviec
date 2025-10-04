const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = 3000;
const duanRoutes = require('./routes/duanRoutes');

app.use(cors());

app.use(bodyParser.json());

// routes...
app.use('/auth', require('./routes/authRoutes'));
app.use('/duan', duanRoutes);
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
