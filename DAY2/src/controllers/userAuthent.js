const User = require("../models/user")
const validate = require("../utils/validator")
const bcrypt = require("bcrypt")
var jwt = require("jsonwebtoken")
const redisClient = require("../config/redis.js");
// register feature
const register = async(req,res)=>{
    try {
        // validate the data coming from the client
        validate(req.body);

        const {firstName,emailId,password} = req.body;
        req.body.password = await bcrypt.hash(password, 10);  
        req.body.role = "user";

       
        const user = await User.create(req.body);
        const token = jwt.sign({_id:user._id,emailId:emailId},process.env.JWT_KEY,{expiresIn:"1h"});
        res.cookie("token",token,{maxAge: 60*60*1000});
        res.status(201).send({message:"User registered successfully"});
    } catch (error) {
        res.status(400).send("Error: "+error.message);
    }
}

// login feature
const login = async(req,res)=>{
    try {
        const {emailId, password} = req.body;

        if(!emailId)
            throw new Error("Invalid Credentials");
        if(!password)
            throw new Error("Invalid Credentials");

        const user = await User.findOne({emailId});

        const match = await bcrypt.compare(password, user.password);
         if(!match)
            throw new Error("Invalid Credentials");

        const token = jwt.sign({_id:user._id,emailId:emailId},process.env.JWT_KEY,{expiresIn:"1h"});
        res.cookie("token",token,{maxAge: 60*60*1000});
        res.status(200).send("Logged in successfully");

    } catch (error) {
        res.status(401).send("Error: "+error.message);
    }
}

// logout feature
const logout = async(req,res)=>{
    try {
        const {token} = req.cookies;
      const payload =   jwt.decode(token);

         // Redis ke blocklist me token ko add karna
        await redisClient.set(`token:${token}`,"Blocked");
         // Token ko 1 hour ke liye block karna
        await redisClient.expire(`token:${token}`, payload.exp);

        // Client ke cookie se token ko remove karna
        res.cookie("token",null,{expires: new Date(Date.now())});
        res.status(200).send("Logged out successfully");

    } catch (error) {
        res.status(503).send("Error: "+error.message);
    }
}


module.exports = {register,login,logout};