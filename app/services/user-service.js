const Users = require('../Model/user-model.js').user;
const Image = require('../Model/image-model.js').image;
const bCrypt = require('bcrypt');


const saveUser = async (userData) => {
    console.log("service")
    try {
        const user = await Users.create(userData);
        return user;
    } catch (error) {
        throw error;
    }
};

const findUser = async (email) => {
    try {
        const user = await Users.findOne({ where: { email } });
        return user;
    }
    catch (error) {
        throw error;
    }
}

const verifyPassword = async (plainPassword, hashedPassword) => {
    try {
        const isMatch = await bCrypt.compare(plainPassword, hashedPassword);
        return isMatch;
    }
    catch (error) {
        throw error;
    }
}

const saveImage = async (image) => {

}

const getImage = async (image) => {

}

const deleteImage = async (image) => {

}
module.exports = { saveUser, verifyPassword, findUser, saveImage, getImage, deleteImage }