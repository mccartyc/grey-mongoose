const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
require('dotenv').config();

app.use(cors());
app.use(bodyParser.json());

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define routes here
app.use('/api/users', require('./routes/userRoutes'));
// Add other routes...

app.listen(5000, () => {
    console.log('Server running on port 5000');
  });
  