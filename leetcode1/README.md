## 🚀 Day 1: Project Setup & Architecture Understanding

### 📌 What I Learned
- Understood overall architecture of a LeetCode-like platform
- Learned how frontend and backend communicate
- Understood code execution flow using Judge0

---

### 🎨 Frontend
Technologies used:
- HTML, CSS, JavaScript
- React
- Tailwind CSS
- Daisy UI

📌 Notes:
- Daisy UI is a Tailwind CSS plugin
- Helps build UI faster with pre-built components
- Reduces CSS effort and improves development speed

---

### ⚙️ Backend
Technologies used:
- Node.js
- Express.js
- MongoDB
- Redis (conceptual understanding)

📌 Key Learnings:
- Backend receives code from frontend
- Sends code for execution
- Returns output to frontend

---

### 🔁 Code Execution Flow
1. User submits code from frontend  
2. Backend receives code  
3. Input test cases are sent  
4. Code executes and generates output  
5. Output is matched with expected output  

✔️ If matched → Accepted  
❌ If not → Wrong Answer  

---

### 🧪 Judge System
- Learned about Judge0 API
- It executes code securely
- Takes:
  - Code
  - Input
  - Language
- Returns output to backend

---

### 🐳 Important Concept
- Code should not run directly on backend server
- Temporary execution environment required
- Avoids security risks

---

### 🏗️ Backend Setup Done
- Express server created
- MongoDB connected using Mongoose
- Environment variables configured
- Basic user schema created

---

### 📂 Folder Structure
DAY1/
├── src/
│ ├── config/
│ │ └── db.js
│ ├── models/
│ │ └── user.js
│ └── index.js
├── .env
├── package.json

---

### 🧩 Database Schema

#### User Schema:
- firstName
- lastName
- emailId (unique)
- age
- role (user/admin)
- problemSolved

---

### 💡 APIs Planned
- User Authentication (Register/Login)
- Problem Creation
- Submission API
- DSA Problem APIs

---

### ⚡ Outcome
✔️ Basic backend initialized  
✔️ Database connected  
✔️ Project structure ready  

---


## 🚀 Day 2: Authentication System (Register, Login, Logout)

### 📌 What I Built
- User Authentication APIs:
  - Register
  - Login
  - Logout

---

### 🔐 Features Implemented

#### 1. Register API
- New user create hota hai database me
- User details store (name, email, password, etc.)

#### 2. Login API
- User login karta hai using credentials
- JWT token generate hota hai
- Token cookies me store hota hai

#### 3. Logout API
- Redis ka use karke token invalidate kiya
- Token ko blocklist me store kiya
- Future requests me blocked token reject hoga

---

### 🧠 Middleware (User Authentication)

- JWT verify karta hai
- User database me exist karta hai ya nahi check karta hai
- Redis me token blocklist check karta hai

```js
const IsBlocked = await redisClient.exists(`token:${token}`);


✔️ If token blocked → Unauthorized
✔️ If valid → Request allowed

⚙️ Technologies Used
Node.js
Express.js
MongoDB
JWT (Authentication)
Redis (Token Blacklisting)


🔁 Authentication Flow
User Login → JWT token generate
Token cookie me store
Protected route → middleware verify token
Logout → token Redis me block
Next request → blocked token reject


📂 New Files Added
authRouter.js
authController.js (register, login, logout)
userMiddleware.js
redis.js (config)

⚡ Outcome

✔️ Complete authentication system working
✔️ Secure logout using Redis
✔️ Protected routes implemented




## 🚀 Day 3: Admin Authentication Middleware (JWT + Redis)

### 📌 What I Built
- Admin authentication middleware
- Protected admin routes
- Token validation system

---

### 🔐 Middleware Features

#### 1. Token Verification
- JWT token cookies se extract kiya
- Token verify using secret key

#### 2. Admin Validation
- Token se `_id` extract kiya
- Database me admin exist karta hai ya nahi check kiya
- Role-based access control (admin only)

#### 3. Redis Token Blacklist Check
- Logout ke baad token Redis me store hota hai
- Middleware check karta hai ki token blocked to nahi

```js
const IsBlocked = await redisClient.exists(`token:${token}`);

✔️ If blocked → Unauthorized
✔️ If valid → Access granted

🔁 Middleware Flow
Request comes to admin protected route
Token extracted from cookies
JWT verified
Admin fetched from DB
Role checked (admin only)
Redis blacklist checked
If valid → next()
Else → 401 Unauthorized

⚙️ Technologies Used
Node.js
Express.js
JWT (Authentication)
Redis (Token Blacklisting)
MongoDB (Admin Validation)
⚡ Outcome

✔️ Admin route protection implemented
✔️ Role-based authentication working
✔️ Secure logout using Redis


## 🚀 Day 4: Problem Creation + Code Execution Utility (Judge0)

### 📌 What I Built
- Problem creation API (Admin only)
- Problem schema & model
- Judge0 integration for code execution
- Language mapping utility

---

### 🔐 Admin Protected Route

```js
problemRouter.post("/create", adminMiddleware, createProblem);
✔️ Only admin can create problems


🧠 Problem Schema
title, description
difficulty (Easy, Medium, Hard)
tags (Array, LinkedList, Graph, DP)
visibleTestCases
hiddenTestCases
startCode
referenceSolution
problemCreator
⚡ Code Execution (Judge0)

Integrated Judge0 API using Axios.

🔤 Language Mapping
const language = {
  "c++": 54,
  "java": 62,
  "javascript": 63
}

📤 Batch Submission
Multiple test cases ek sath submit hote hain
Judge0 unko execute karta hai
Output return hota hai
🔁 Execution Flow
User submits code
Backend → Judge0 API
Code + test cases send
Judge0 executes code
Output return
Backend compares results

⚙️ Technologies Used
Node.js
Express.js
MongoDB
Mongoose
JWT + Redis
Axios
Judge0 API

⚡ Outcome

✔️ Problem creation system ready
✔️ Code execution utility integrated
✔️ Multi-language support added
✔️ Ready for full coding platform

---

## Judge0 (Docker, local)

If RapidAPI subscription is a problem, run Judge0 locally with Docker and set `JUDGE0_URL=http://localhost:2358`.

Steps: `docs/judge0-docker.md`

---

## Problem Create (Always Success)

If your immediate goal is to save problems from Postman and always get a success response, the backend now supports skipping Judge0 validation:

- Details: `docs/problem-created-successfully.md`



day6
## 🚀 Day 6+7: Problem Management + Submission System (Without Judge0)

### 📌 What I Built
- Problem update & delete APIs (Admin)
- Get problem APIs (User)
- Code submission system
- Optional Judge0 execution (can skip)

---

## 🔐 Admin Features

### Update Problem
```js
problemRouter.put("/update/:id", adminMiddleware, updateProblem);


Delete Problem
problemRouter.delete("/delete/:id", adminMiddleware, deleteProblem);

✔️ Only admin can modify problems

👤 User Features
Get Single Problem
problemRouter.get("/problemById/:id", userMiddleware, getProblemById);
Get All Problems
problemRouter.get("/getAllProblem", userMiddleware, getAllProblem);

✔️ Authenticated users can access problems

💻 Code Submission System
Submit API
submitRouter.post("/submit/:id", userMiddleware, submitCode);
⚡ Submission Flow
User submits code
Backend validates request
Problem fetched from DB
Submission stored with status = pending
🧪 Without Judge0 (Current Mode)
SKIP_JUDGE0_EXECUTION=true

✔️ Code execution skip ho jata hai
✔️ Direct result:

status = accepted
all test cases passed
🧠 With Judge0 (Optional)
Code → Judge0 API
Test cases run
Output compare
Status decide:
accepted
wrong
error
📊 Submission Tracking

Stored fields:

userId
problemId
code
language
status
testCasesPassed
runtime
memory
errorMessage
⚙️ Technologies Used
Node.js
Express.js
MongoDB
Mongoose
JWT + Redis
Axios (Judge0 optional)
⚡ Outcome

✔️ Full problem CRUD system
✔️ User can fetch problems
✔️ Code submission system working
✔️ Judge0 dependency removed (optional)
✔️ System works even without Docker/Judge0






day8


## 🚀 Day 8: Submission System + User Tracking + Rate Limiting (Production Ready)

---

## 📌 Overview

Day 8 me backend ko production-ready banaya gaya by adding:

- User progress tracking
- Submission history
- Run code API
- Profile deletion with cascade
- ✅ Submit Code Rate Limiter (NEW)

System ab scalable, secure aur optimized hai.

---

## 🔥 Why Rate Limiter is Important?

### ❗ Problem Without Rate Limiter
Agar user unlimited requests bheje:

- Server overload ho sakta hai
- API abuse ho sakta hai
- Infinite submissions → performance down

---

### ✅ Solution: Rate Limiting

```js
submitcodeRateLimiter


👉 Ye control karta hai:

Ek user kitni baar /submit API hit kar sakta hai
💡 Example
Max: 5 requests
Time: 1 minute

👉 Agar user 6th request bheje:

Too many requests, try again later
🧠 Submission System (Deep Dive)
📌 API
POST /submit/:id
🔁 Step-by-Step Flow
1️⃣ Authentication
const userId = req.result?._id;

✔ Middleware se user verify hota hai

2️⃣ Input Handling
const body = getParsedBody(req.body);
const code = body?.code ?? body?.source_code ?? body?.solution;
const language = body?.language ?? body?.lang;

✔ Flexible API design
✔ Multiple input formats support

3️⃣ Validation
userId present?
problemId valid?
code & language present?
mongoose.Types.ObjectId.isValid(problemId)
4️⃣ Problem Fetch
const problem = await Problem.findById(problemId);

✔ DB se problem fetch hota hai

5️⃣ Initial Submission Store
const submittedResult = await Submission.create({
  userId,
  problemId,
  code,
  language,
  status: 'pending',
  testCasesTotal: problem.hiddenTestCases.length
});

✔ Submission DB me store hota hai

⚡ Without Judge0 Execution (Current Mode)
SKIP_JUDGE0_EXECUTION=true
Behavior:
submittedResult.status = "accepted";
submittedResult.testCasesPassed = problem.hiddenTestCases.length;

✔ Fast response
✔ No external dependency

🧠 Problem Solved Tracking
await User.updateOne(
  { _id: userId },
  { $addToSet: { problemSolved: problemId } }
);
Why $addToSet?
Duplicate entries avoid hoti hain
Clean user progress maintain hota hai
📊 Submission History
API
GET /submission/:pid

✔ All attempts track hote hain
✔ Debugging easy hoti hai

⚡ Run Code API
POST /run/:id
Use Case:
Code test karna without submission
Debugging
Without Judge0:

✔ Mock response generate hota hai
✔ Instant feedback milta hai

🗑️ Delete Profile (Cascade Delete)
userSchema.post('findOneAndDelete', async function (userInfo) {
  await mongoose.model('submission').deleteMany({ userId: userInfo._id });
});
Why?
Orphan data avoid hota hai
Database clean rehta hai
⚙️ Rate Limiter (Detailed)
Example Implementation
const rateLimit = require("express-rate-limit");

const submitcodeRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: "Too many submissions, please try again later"
});
Apply on Route:
submitRouter.post("/submit/:id", submitcodeRateLimiter, userMiddleware, submitCode);
🔥 Benefits

✔ Prevent API abuse
✔ Protect server
✔ Improve performance
✔ Fair usage for all users

⚙️ Technologies Used
Node.js
Express.js
MongoDB
Mongoose
JWT + Redis
Rate Limiter
Axios (optional)
📚 Key Learnings
Secure API design
Rate limiting concept
Submission lifecycle
User progress tracking
Scalable backend architecture
⚠️ Challenges
Handling multiple input formats
Designing rate limiter
Maintaining DB consistency
Working without Judge0
✅ Final Outcome

✔ Full submission system
✔ User progress tracking
✔ Secure APIs (Rate limiting)
✔ Clean DB management
✔ Works without Judge0

