

const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const errorHandler = require('./middleware/errorHandler');

const authRoutes        = require('./routes/auth.routes');
const jobRoutes         = require('./routes/job.routes');
const applicationRoutes = require('./routes/application.routes');
const userRoutes        = require('./routes/user.routes');
const dashboardRoutes   = require('./routes/dashboard.routes');

const app = express();

app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ success: true, message: 'Akazi Scroll API is running' });
});

app.use('/api/auth',         authRoutes);
app.use('/api/jobs',         jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/users',        userRoutes);
app.use('/api/dashboard',    dashboardRoutes);

app.use(errorHandler);

module.exports = app;