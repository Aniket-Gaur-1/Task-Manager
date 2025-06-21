const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const socketIo = require('socket.io');
const { Server } = require('socket.io');
const http = require('http');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: 'https://task-manager-pi-beige-92.vercel.app',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true,
    },
});
app.use(express.json());
app.use(cookieParser());

app.use(cors({
    origin: "https://task-manager-pi-beige-92.vercel.app",
    credentials: true,
}));

const tasksRoutes = require('./routes/task');
const projectsRoutes = require('./routes/project');
const loginRoutes = require('./routes/login');
const registerRoutes = require('./routes/register');
const userRoutes = require('./routes/user');
const activityRoutes = require('./routes/activity');
const logoutRoutes = require('./routes/logout');
const refreshRoutes = require('./routes/refresh');

app.use('/api/tasks', tasksRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/login', loginRoutes);
app.use('/api/register', registerRoutes);
app.use('/api/user', userRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/logout', logoutRoutes);
app.use('/api/refresh', refreshRoutes);

io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);
    socket.on('disconnect', () => console.log('Socket disconnected:', socket.id));
});

mongoose.connect(process.env.MONGO_URI)
    .then(() => server.listen(process.env.PORT || 5000, () => console.log(`Server running on port ${process.env.PORT || 5000}`)))
    .catch((err) => console.error('MongoDB error:', err.message));