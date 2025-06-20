const jwt = require('jsonwebtoken');

module.exports = async(req, res, next) => {
    const authHeader = req.headers.authorization;

    // Check for Bearer token in Authorization header
    const token = authHeader && authHeader.startsWith('Bearer ') ?
        authHeader.split(' ')[1] :
        null;

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // token payload (e.g., { id, role, ... })
        next();
    } catch (err) {
        console.error('Auth error:', err.message);
        res.status(401).json({ message: 'Invalid token' });
    }
};