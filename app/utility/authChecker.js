const bcrypt = require('bcrypt');
const { findUser, verifyPassword } = require("../services/user-service.js");

const basicAuth = async (req, res, next) => {
    const authHeader = req.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Basic ')) {
        return res.status(401).json({ message: 'Missing or invalid Authorization header' });
    }

    try {
        // Decode the base64 encoded credentials
        const base64Credentials = authHeader.split(' ')[1];
        const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
        const [email, password] = credentials.split(':');

        // Find user by email
        const user = await findUser(email);
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // Verify the password for non-PUT requests
        const isPasswordValid = await verifyPassword(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // For PUT requests, only check if the user exists without verifying password
        if (req.method === 'PUT') {
            req.user = user;
            return next();
        }

        // Attach user to request if verification succeeds
        req.user = user;
        next();
    } catch (error) {
        return res.status(500).json({ message: "Error verifying credentials", error: error.message });
    }
};


const verifyUserMiddleware = (req, res, next) => {
    const user = req.user;
    if (!user.is_verified) {
        return res.status(403).json({ message: "User email not verified" });
    }
    next();
}

module.exports = { basicAuth, verifyUserMiddleware };
