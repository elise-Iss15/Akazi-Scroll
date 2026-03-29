require('dotenv').config();
const app  = require('./src/app');
const pool = require('./src/config/db');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Akazi Scroll API running on port ${PORT}`);
});

