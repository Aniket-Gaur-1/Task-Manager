const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const socketIo = require('socket.io');
const http = require('http');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*', // Allow all origins for Socket.IO
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true, // Allow credentials if needed
    },
});
app.use(express.json());
app.use(cookieParser());
app.use(cors());

const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, enum: ['member', 'admin'], default: 'member' },
});
const User = mongoose.model('User', UserSchema);

const ProjectSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});
const Project = mongoose.model('Project', ProjectSchema);

const TaskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    status: { type: String, enum: ['To Do', 'In Progress', 'Done'], default: 'To Do' },
    dueDate: Date,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});
const Task = mongoose.model('Task', TaskSchema);

const ActivitySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: String,
    timestamp: { type: Date, default: Date.now },
});
const Activity = mongoose.model('Activity', ActivitySchema);

const authenticate = async(req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'No token' });

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (err) {
        console.error('Auth error:', err.message);
        res.status(401).json({ message: 'Invalid token' });
    }
};


const adminOnly = async(req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
    }
    next();
};

app.post('/api/register', async(req, res) => {
    const { email, password, name } = req.body;
    try {
        if (await User.findOne({ email })) return res.status(400).json({ message: 'User exists' });
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ email, password: hashedPassword, name, role: 'member' });
        await user.save();
        await new Activity({ userId: user._id, action: `User ${email} registered` }).save();
        res.status(201).json({ message: 'User created' });
    } catch (err) {
        console.error('Register error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/login', async(req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const accessToken = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
        const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_SECRET, { expiresIn: '7d' });
        res.cookie('refreshToken', refreshToken, { httpOnly: true, sameSite: 'strict' });
        await new Activity({ userId: user._id, action: `User ${email} logged in` }).save();
        res.json({ accessToken, role: user.role });
    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/refresh', async(req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return res.status(401).json({ message: 'No refresh token' });
    try {
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
        const user = await User.findById(decoded.id);
        if (!user) return res.status(401).json({ message: 'Invalid token' });
        const accessToken = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ accessToken });
    } catch (err) {
        console.error('Refresh error:', err.message);
        res.status(401).json({ message: 'Invalid refresh token' });
    }
});

app.post('/api/logout', async(req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
        try {
            const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
            await new Activity({ userId: decoded.id, action: 'User logged out' }).save();
        } catch (err) {
            console.error('Logout activity error:', err.message);
        }
    }
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out' });
});

app.get('/api/users', authenticate, adminOnly, async(req, res) => {
    try {
        const users = await User.find().select('name email _id');
        res.json(users);
    } catch (err) {
        console.error('Users fetch error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/api/users/:id', authenticate, async(req, res) => {
    try {
        if (req.user.id !== req.params.id) return res.status(403).json({ message: 'Unauthorized' });
        const user = await User.findById(req.params.id).select('email name role');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) {
        console.error('User fetch error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

app.put('/api/users/:id', authenticate, async(req, res) => {
    const { name, password } = req.body;
    try {
        if (req.user.id !== req.params.id) return res.status(403).json({ message: 'Unauthorized' });
        const updateData = {};
        if (name) updateData.name = name;
        if (password) updateData.password = await bcrypt.hash(password, 10);
        const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true }).select('email name role');
        if (!user) return res.status(404).json({ message: 'User not found' });
        await new Activity({ userId: user._id, action: `User ${user.email} updated profile` }).save();
        res.json(user);
    } catch (err) {
        console.error('User update error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/api/projects', authenticate, async(req, res) => {
    try {
        const projects = await Project.find({ createdBy: req.user.id });
        res.json(projects);
    } catch (err) {
        console.error('Projects error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/api/projects/:id', authenticate, async(req, res) => {
    try {
        const project = await Project.findOne({ _id: req.params.id, createdBy: req.user.id });
        if (!project) return res.status(404).json({ message: 'Project not found' });
        res.json(project);
    } catch (err) {
        console.error('Project fetch error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/projects', authenticate, async(req, res) => {
    const { name, description } = req.body;
    try {
        const project = new Project({ name, description, createdBy: req.user.id });
        await project.save();
        await new Activity({ userId: req.user.id, action: `Created project ${name}` }).save();
        io.emit('projectCreated', project);
        res.status(201).json(project);
    } catch (err) {
        console.error('Project creation error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

app.put('/api/projects/:id', authenticate, async(req, res) => {
    const { name, description } = req.body;
    try {
        const project = await Project.findOneAndUpdate({ _id: req.params.id, createdBy: req.user.id }, { name, description }, { new: true });
        if (!project) return res.status(404).json({ message: 'Project not found' });
        await new Activity({ userId: req.user.id, action: `Updated project ${name}` }).save();
        io.emit('projectUpdated', project);
        res.json(project);
    } catch (err) {
        console.error('Project update error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/api/tasks', authenticate, async(req, res) => {
    try {
        const query = {
            $or: [
                { createdBy: req.user.id },
                { assignedTo: req.user.id },
            ],
        };
        if (req.query.projectId) {
            query.projectId = req.query.projectId;
        }
        const tasks = await Task.find(query).populate('projectId', 'name').populate('assignedTo', 'name');
        res.json(tasks);
    } catch (err) {
        console.error('Tasks error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/api/tasks/:id', authenticate, async(req, res) => {
    try {
        const task = await Task.findOne({
            _id: req.params.id,
            $or: [
                { createdBy: req.user.id },
                { assignedTo: req.user.id },
            ],
        }).populate('projectId', 'name').populate('assignedTo', 'name');
        if (!task) return res.status(404).json({ message: 'Task not found' });
        res.json(task);
    } catch (err) {
        console.error('Task fetch error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/tasks', authenticate, adminOnly, async(req, res) => {
    const { title, description, projectId, status, dueDate, assignedTo } = req.body;
    try {
        const taskData = {
            title,
            description,
            projectId,
            status,
            dueDate: dueDate ? new Date(dueDate) : undefined,
            createdBy: req.user.id,
            assignedTo: assignedTo || undefined,
        };
        const task = new Task(taskData);
        await task.save();
        await new Activity({ userId: req.user.id, action: `Created task ${title}` }).save();
        const populatedTask = await Task.findById(task._id).populate('projectId', 'name').populate('assignedTo', 'name');
        io.emit('taskCreated', populatedTask);
        res.status(201).json(populatedTask);
    } catch (err) {
        console.error('Task creation error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

app.put('/api/tasks/:id', authenticate, adminOnly, async(req, res) => {
    const { title, description, projectId, status, dueDate, assignedTo } = req.body;
    try {
        const task = await Task.findOneAndUpdate({ _id: req.params.id, createdBy: req.user.id }, {
            title,
            description,
            projectId,
            status,
            dueDate: dueDate ? new Date(dueDate) : undefined,
            assignedTo: assignedTo || undefined,
        }, { new: true }).populate('projectId', 'name').populate('assignedTo', 'name');
        if (!task) return res.status(404).json({ message: 'Task not found' });
        await new Activity({ userId: req.user.id, action: `Updated task ${title}` }).save();
        io.emit('taskUpdated', task);
        res.json(task);
    } catch (err) {
        console.error('Task update error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

app.patch('/api/tasks/:id/status', authenticate, async(req, res) => {
    const { status } = req.body;
    try {
        if (!['To Do', 'In Progress', 'Done'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }
        const task = await Task.findOne({
            _id: req.params.id,
            $or: [
                { createdBy: req.user.id },
                { assignedTo: req.user.id },
                { projectId: { $in: await Project.find({ createdBy: req.user.id }).distinct('_id') } },
            ],
        }).populate('projectId', 'createdBy');
        if (!task) return res.status(404).json({ message: 'Task not found' });
        task.status = status;
        await task.save();
        await new Activity({ userId: req.user.id, action: `Updated task ${task.title} status to ${status}` }).save();
        const updatedTask = await Task.findById(req.params.id).populate('projectId', 'name').populate('assignedTo', 'name');
        io.emit('taskUpdated', updatedTask);
        res.json(updatedTask);
    } catch (err) {
        console.error('Task status update error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/api/activity', authenticate, async(req, res) => {
    try {
        const activities = await Activity.find({ userId: req.user.id }).sort({ timestamp: -1 }).limit(50);
        res.json(activities);
    } catch (err) {
        console.error('Activity fetch error:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);
    socket.on('disconnect', () => console.log('Socket disconnected:', socket.id));
});

mongoose.connect(process.env.MONGO_URI)
    .then(() => server.listen(5000, () => console.log('Server running on port 5000')))
    .catch((err) => console.error('MongoDB error:', err.message));