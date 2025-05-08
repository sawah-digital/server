const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./config/db'); // This will automatically test the connection
const userRoute = require('./routes/userRoute');
const dataRoute = require('./routes/dataRoute');
const formRoute = require('./routes/formRoute');
const helperRoute = require('./routes/helperRoute');

const app = express();
app.use(cors());
app.use(express.json());

// app.use('/api/users', usersRoute);

app.get('/', (req, res) => {
  res.send('Welcome to the Sawah Digital Apps');
});

app.use('/user', userRoute);
app.use('/data', dataRoute);
app.use('/form', formRoute);
app.use('/helper', helperRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));