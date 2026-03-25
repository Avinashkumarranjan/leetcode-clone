const jwt = require("jsonwebtoken");
const User = require("../models/user.js");
const redisClient = require("../config/redis.js");

const userMiddleware = async (req,res,next)=>{
    try {
        const {token} = req.cookies;
        if(!token)
            throw new Error("Token is not present");

        const payload = jwt.verify(token,process.env.JWT_KEY);

        const {_id} = payload;

        if(!_id){
            throw new Error("Invalid token");
        }   
        const result = await User.findById(_id);

        if(!result){
            throw new Error("User Does'nt Exist");
        }

        // Redis ke blocklist me token to present nahi hai uske check karne ke liye
        
       const IsBlocked = await redisClient.exists(`token:${token}`);
        if(IsBlocked){
            throw new Error("Token is blocked");
        } 
        req.result = result;
        next();

    } catch (error) {
        res.status(401).json({message: error.message});
    }
}

module.exports = userMiddleware;