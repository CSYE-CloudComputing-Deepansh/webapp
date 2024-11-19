const userService = require("../services/user-service");

const verify = async (req, res) =>{
    const { token, userId } = req.query;

    try {
        const user = await userService.findUserById(userId);

        if (!user || user.verification_token !== token || new Date() > user.token_expiry) {
            return res.status(400).json({ message: "Invalid or expired token" });
        }

        await userService.updateUserVerification(userId);
        res.status(200).json({ message: "Email verified successfully" });
    } catch (error) {
        res.status(500).json({ message: "Verification failed", error: error.message });
    }
}

module.exports = {verify};