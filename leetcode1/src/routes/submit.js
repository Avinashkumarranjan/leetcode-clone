const express = require('express');
const submitRouter = express.Router();
const userMiddleware = require("../middleware/userMiddleware");
const {submitCode,runCode} = require("../controllers/userSubmission");
const submitCodeRateLimiter = require("../middleware/submitCodeRateLimiter");

submitRouter.post("/submit/:id", userMiddleware, submitCodeRateLimiter, submitCode);
submitRouter.post("/run/:id",userMiddleware,runCode);
module.exports = submitRouter;





























