import Users from '../Model/user-model.js';
import bCrypt from 'bcrypt';

export const saveUser = async (userData) => {
    console.log("service")
    try {
        const user = await Users.create(userData);
        return user;
    } catch (error) {
        throw error;
    }
};

export const findUser = async (email) => {
    try {
        const user = await Users.findOne({ where: { email } });
        return user;
    }
    catch (error) {
        throw error;
    }
}

export const verifyPassword = async (plainPassword, hashedPassword) => {
    try{
        const isMatch = await bCrypt.compare(plainPassword, hashedPassword);
        return isMatch;
    }
    catch(error){
        throw error;
    }
}