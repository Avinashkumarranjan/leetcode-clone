const jwt = require("jsonwebtoken");
const User = require("../models/user.js");
const redisClient = require("../config/redis.js");

const adminMiddleware = async (req, res, next) => {
    try {
        let token;

        // ✅ पहले cookies check
        if (req.cookies?.token) {
            token = req.cookies.token;
        } 
        // ✅ fallback to headers
        else if (req.headers.authorization?.startsWith("Bearer ")) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            throw new Error("Token is not present");
        }

        const payload = jwt.verify(token, process.env.JWT_KEY);

        const { _id } = payload;

        if (!_id) {
            throw new Error("Invalid token");
        }

        const result = await User.findById(_id);

        if (payload.role !== "admin") {
            throw new Error("Access Denied: Admin Only");
        }

        if (!result) {
            throw new Error("User Doesn't Exist");
        }

        const isBlocked = await redisClient.exists(`token:${token}`);

        if (isBlocked) {
            throw new Error("Token is blocked");
        }

        req.result = result;
        next();

    } catch (error) {
        res.status(401).json({ message: error.message });
    }
};

module.exports = adminMiddleware;