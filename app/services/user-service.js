const Users = require('../Model/user-model.js').user;
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
    try{
        const isMatch = await bCrypt.compare(plainPassword, hashedPassword);
        return isMatch;
    }
    catch(error){
        throw error;
    }
}

module.exports ={saveUser, verifyPassword, findUser}