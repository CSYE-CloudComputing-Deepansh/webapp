const { setDataResponse, setDataErrorResponse } = require('../utility/response-handler.js');
const userService = require("../services/user-service.js");
const { request, response } = require('express');
const bCrypt = require('bcrypt');


const saveUser = async (request, response) => {
    try {
        const { first_name, last_name, email, password } = request.body;

        if (!first_name || !last_name || !email || !password) {
            return response.status(400).json({ message: "All fields needed" });
        }

        const existingUser = await userService.findUser(email);

        if (existingUser) {
            return response.status(400).json({ message: "User already exists" });
        }

        const saltRounds = 10;
        const salt = bCrypt.genSaltSync(saltRounds);
        const encryptedPassword = bCrypt.hashSync(password, salt);

        const newUser = {
            first_name,
            last_name,
            email,
            password: encryptedPassword,
            account_created: new Date(),
            account_updated: new Date()
        }

        const basicAuthToken = generateBasicAuthToken(email, password);

        const user = await userService.saveUser(newUser);
        return response.status(201).set('authorization', basicAuthToken).json({
                id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name, account_created: user.account_created, account_updated: user.account_updated
        });
    }
    catch (error) {
        return response.status(400).json("Error- " + error.name + ". The error is - " + error.message);
    }
}

const getUser = async (request, response) => {
    try {

        const user = request.user;
        return response.status(200).set('Cache-Control', 'no-cache').json({
            id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name, account_created: user.account_created, account_updated: user.account_updated
        });
    }
    catch (error) {
        return response.status(500).set('Cache-Control', 'no-cache').json({ message: 'Error retrieving user details', error: error });
    }
}

const updateUser = async (request, response) => {
    try {
        const user = request.user; // Assuming the user is attached by the authentication middleware

      // If the request body is empty, return 204 No Content
      if (!request.body || Object.keys(request.body).length === 0) {
        return response.status(204).send(); // 204 No Content
      }

      // Define the allowed fields for update
      const allowedFields = ['first_name', 'last_name', 'email', 'password'];

      // Extract the fields from the request body
      const updates = Object.keys(request.body);

      // Check if any forbidden fields are included in the request
      const forbiddenFields = ['accountCreated', 'accountUpdated'];
      const isInvalidUpdate = updates.some((field) => !allowedFields.includes(field) || forbiddenFields.includes(field));

      if (isInvalidUpdate) {
        return response.status(400).json({
          message: 'Invalid fields in request. You can only update firstName, lastName, email, or password.',
        });
      }

      // Update the allowed fields
      updates.forEach((field) => {
        if (field === 'password') {
          user.password = bCrypt.hashSync(request.body.password, 10); // Hash the password before updating
        } else {
          user[field] = request.body[field];
        }
      });

      // Update the accountUpdated field
      user.account_updated = new Date();

      // Save the updated user to the database
      await user.save();

      const basicAuthToken = generateBasicAuthToken(user.email, request.body.password);


      // Respond with the updated user details (excluding sensitive information like password)
      return response.status(200).set('authorization', basicAuthToken).set('Cache-Control', 'no-cache').json({message:"done"})
    //   return response.status(200).set('authorization', basicAuthToken).json({
    //     message: 'User updated successfully',
    //     user: {
    //       first_name: user.first_name,
    //       last_name: user.last_name,
    //       email: user.email,
    //       account_updated: user.account_updated,
    //     },
    //   })
    } catch (error) {
        return response.status(500).json({ message: 'Error updating user details', error: error });
    }
}

//generate a basic token based on user email and password
const generateBasicAuthToken = (email, password) => {
    const credentials = `${email}:${password}`;
    const base64Token = Buffer.from(credentials).toString('base64');
    return `Basic ${base64Token}`;
}

module.exports={saveUser, updateUser, getUser}