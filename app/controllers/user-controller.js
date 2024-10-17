const bcrypt = require('bcrypt');
const userService = require("../services/user-service.js");

const saveUser = async (req, res) => {
    try {
        const { first_name, last_name, email, password } = req.body;

        if (!first_name || !last_name || !email || !password) {
            return res.status(400).json({ message: "All fields needed" });
        }

         // Email format validation using regex
         const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
         if (!emailRegex.test(email)) {
             return res.status(400).json({ message: "Invalid email format" });
         }

        const existingUser = await userService.findUser(email);
        if (existingUser) {
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
        return res.status(201).json({
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            account_created: user.account_created,
            account_updated: user.account_updated,
        });
    } catch (error) {
        return res.status(500).json({ message: "Error saving user", error: error.message });
    }
};

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
        return res.status(500).json({ message: "Error retrieving user details", error: error.message });
    }
};

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
        if (!emailRegex.test(email)) {
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
        return res.status(500).json({ message: "Error updating user details", error: error.message });
    }
};

module.exports = { saveUser, getUser, updateUser };
