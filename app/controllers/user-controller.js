const bcrypt = require('bcrypt');
const userService = require("../services/user-service.js");
const logger = require('../utils/logger');
const recordMetric = require('../utils/statsd');

// Save a new user
const saveUser = async (req, res) => {
    try {
        const start = Date.now(); // Start the timer for the API call
        const { first_name, last_name, email, password } = req.body;

        if (!first_name || !last_name || !email || !password) {
            logger.warn('Missing required fields in saveUser');
            recordMetric('api.saveUser.failure'); // Increment failure count
            return res.status(400).json({ message: "All fields needed" });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            logger.warn(`Invalid email format for email: ${email}`);
            recordMetric('api.saveUser.failure'); // Increment failure count
            return res.status(400).json({ message: "Invalid email format" });
        }

        const existingUser = await userService.findUser(email);
        if (existingUser) {
            logger.warn(`User already exists with email: ${email}`);
            recordMetric('api.saveUser.failure'); // Increment failure count
            return res.status(400).json({ message: "User already exists" });
        }

        const encryptedPassword = bcrypt.hashSync(password, 10);
        const newUser = {
            first_name,
            last_name,
            email,
            password: encryptedPassword,
            account_created: new Date(),
            account_updated: new Date(),
        };

        const user = await userService.saveUser(newUser);
        logger.info(`User created with email: ${user.email}`);

        // Record success metric and API call duration
        recordMetric('api.saveUser.success'); // Increment success count
        const duration = Date.now() - start;
        recordMetric('api.saveUser.duration', duration, 'timing'); // Log duration in ms

        return res.status(201).json({
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            account_created: user.account_created,
            account_updated: user.account_updated,
        });
    } catch (error) {
        logger.error(`Error in saveUser: ${error.message}`);
        recordMetric('api.saveUser.failure'); // Increment failure count
        return res.status(500).json({ message: "Error saving user", error: error.message });
    }
};

// Get the authenticated user's information
const getUser = async (req, res) => {
    try {
        const user = req.user;
        return res.status(200).json({
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            account_created: user.account_created,
            account_updated: user.account_updated,
        });
    } catch (error) {
        logger.error(`Error in getUser: ${error.message}`);
        recordMetric('api.getUser.failure'); // Increment failure count
        return res.status(500).json({ message: "Error retrieving user details", error: error.message });
    }
};

// Update the authenticated user's information
const updateUser = async (req, res) => {
    try {
        const user = req.user;
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(204).send();
        }

        const allowedFields = ['first_name', 'last_name', 'email', 'password'];
        const forbiddenFields = ['accountCreated', 'accountUpdated'];
        const updates = Object.keys(req.body);

        const isInvalidUpdate = updates.some(
            (field) => !allowedFields.includes(field) || forbiddenFields.includes(field)
        );

        // Email format validation using regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (req.body.email && !emailRegex.test(req.body.email)) {
            return res.status(400).json({ message: "Invalid email format" });
        }

        if (isInvalidUpdate) {
            return res.status(400).json({
                message: 'Invalid fields in request. You can only update firstName, lastName, email, or password.',
            });
        }

        updates.forEach((field) => {
            if (field === 'password') {
                user.password = bcrypt.hashSync(req.body.password, 10);
            } else {
                user[field] = req.body[field];
            }
        });

        user.account_updated = new Date();
        await user.save();

        return res.status(200).json({ message: "User updated successfully" });
    } catch (error) {
        logger.error(`Error in updateUser: ${error.message}`);
        recordMetric('api.updateUser.failure'); // Increment failure count
        return res.status(500).json({ message: "Error updating user details", error: error.message });
    }
};

// Save profile picture
const saveProfilePic = async (req, res) => {
    const start = Date.now();
    try {
        const user = req.user;
        const file = req.file;

        if (!file) {
            recordMetric('api.saveProfilePic.failure');
            return res.status(400).json({ message: "No file uploaded" });
        }

        // Save image metadata in the database
        const imageMetadata = {
            file_name: file.key,
            url: file.location,
            user_id: user.id
        };

        const imageRecord = await userService.saveImage(imageMetadata);
        recordMetric('api.saveProfilePic.success');
        const duration = Date.now() - start;
        recordMetric('api.saveProfilePic.duration', duration, 'timing');

        return res.status(201).json({ message: "Profile picture uploaded", image: imageRecord });
    } catch (error) {
        recordMetric('api.saveProfilePic.failure');
        return res.status(500).json({ message: "Error uploading profile picture", error: error.message });
    }
};

// Get profile picture
const getProfilePic = async (req, res) => {
    try {
        const user = req.user;
        const image = await userService.getImage({ user_id: user.id });
        
        if (!image) {
            return res.status(404).json({ message: "Profile picture not found" });
        }

        return res.status(200).json(image);
    } catch (error) {
        recordMetric('api.getProfilePic.failure');
        return res.status(500).json({ message: "Error fetching profile picture", error: error.message });
    }
};

// Delete profile picture
const deleteProfilePic = async (req, res) => {
    try {
        const user = req.user;
        const image = await userService.getImage({ user_id: user.id });

        if (!image) {
            return res.status(404).json({ message: "Profile picture not found" });
        }

        // Delete image from S3
        await s3.deleteObject({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: image.file_name
        }).promise();

        // Remove image record from the database
        await userService.deleteImage(image.id);

        recordMetric('api.deleteProfilePic.success');
        return res.status(200).json({ message: "Profile picture deleted successfully" });
    } catch (error) {
        recordMetric('api.deleteProfilePic.failure');
        return res.status(500).json({ message: "Error deleting profile picture", error: error.message });
    }
};

module.exports = { saveUser, getUser, updateUser, saveProfilePic, getProfilePic, deleteProfilePic };
