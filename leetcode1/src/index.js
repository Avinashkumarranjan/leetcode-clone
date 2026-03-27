const express = require("express")
const app = express();
require("dotenv").config();
const main = require("./config/db.js");
const cookieParser = require("cookie-parser");
const authRouter = require("./routes/userAuth.js");
const redisClient = require("./config/redis.js");
const problemRouter = require("./routes/problemCreator.js");




app.use(express.json());
app.use(cookieParser());
app.use("/user",authRouter);
app.use("/problem",problemRouter);


const InitializeConnection = async()=>{
    try {
      await Promise.all([main(),redisClient.connect()]);
      console.groupCollapsed("DB Connected")

       app.listen(process.env.PORT,()=>{
         console.log("Server is listening at port number:" + process.env.PORT);
       })
    } catch (error) {
      console.log("Error:", error);
    }
}

InitializeConnection();


// main().then(async()=>{
//     app.listen(process.env.PORT,()=>{
//       console.log("Server is listening at port number:" + process.env.PORT);
//     })
// })
// .catch(err=>console.log("Error Occurred: "+err));