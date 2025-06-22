const jwt = require('jsonwebtoken');

module.exports = async(req, res, next) => {
    const authHeader = req.headers.authorization;

    const token = authHeader && authHeader.startsWith('Bearer ') ?
        authHeader.split(' ')[1] :
        null;

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { id: decoded.id, role: decoded.role }; // Explicitly set id and role
        console.log('Authenticated user:', req.user); // Debug
        next();
    } catch (err) {
        console.error('Auth error:', err.message);
        res.status(401).json({ message: 'Invalid token' });
    }
};