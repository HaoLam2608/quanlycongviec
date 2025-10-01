const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Cho phép frontend ở port 3001 gọi API
app.use(cors());


app.use(bodyParser.json());

// routes...
app.use('/auth', require('./routes/authRoutes'));

app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
