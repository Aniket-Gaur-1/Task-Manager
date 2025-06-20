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
        origin: 'https://task-manager-mauve-one.vercel.app', // Allow all origins for Socket.IO
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true, // Allow credentials if needed
    },
});
app.use(express.json());
app.use(cookieParser());

app.use(
    cors({
        origin: "https://task-manager-mauve-one.vercel.app", // ✅ your frontend domain
        credentials: true, // ✅ allow cookies and auth headers
    })
);

const tasksRoutes = require('./routes/tasks');
const projectsRoutes = require('./routes/projects');
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
    .then(() => server.listen(5000, () => console.log('Server running on port 5000')))
    .catch((err) => console.error('MongoDB error:', err.message));