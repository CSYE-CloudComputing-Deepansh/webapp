import Users from "../Model/user-model.js";
import { findUser, verifyPassword } from "../services/user-service.js";

export const basicAuth = async (request, response, next) => {
    const authHeader = request.get('authorization');
    console.log(request.header)
    if (!authHeader || !authHeader.startsWith('Basic ')) {
        return response.status(401).json({ message: 'Missing or invalid Authorization header' });
    }

    try {
        const base64Credentials = authHeader.split(' ')[1];
        const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
        const [email, password] = credentials.split(':');

        const user = await findUser(email);
        if (!user) {
            response.status(400).json({ message: "Invalid email or password" });
        }
        
        if (request.method === 'PUT') {
            request.user = user;  
            return next();  
        }

        const isPassValid = await verifyPassword(password, user.password);
        if (!isPassValid) {
            return response.status(401).json({ message: "Invalid email or password" });
        }

        request.user = user;
        next();
    }
    catch (error) {
        return response.status(500).json({ message: "Error verifying credentials", error: error.message });
    }
}
