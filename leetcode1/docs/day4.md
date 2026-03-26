# 📅 Day 4: Problem Creation System + Code Execution Utility

---

## 🚀 Overview

Day 4 me maine coding platform ka core feature implement kiya:
- Admin-based problem creation system
- Problem schema design (complex structure)
- Judge0 API integration for code execution
- Multi-language support

Ye features kisi bhi coding platform (like LeetCode) ke backbone hote hain.

---

## 🔐 1. Admin Protected Problem Creation

### Route:
```js
problemRouter.post("/create", adminMiddleware, createProblem);

Explanation:
Ye route sirf admin ke liye accessible hai
adminMiddleware ensure karta hai ki:
Token valid ho
User exist kare
Role = admin ho
Flow:
Request aati hai
Middleware token verify karta hai
Role check hota hai (admin)
Problem create hota hai DB me
🧠 2. Problem Schema Design (MongoDB)

Maine ek detailed schema design kiya jo real-world coding platforms jaisa hai.

Fields:
📌 Basic Info
title: Problem ka naam
description: Problem statement
📊 Difficulty
enum: ["Easy", "Medium", "Hard"]
🏷️ Tags
enum: ["Array", "LinkedList", "Graph", "DP"]
🧪 3. Test Case System
✅ Visible Test Cases
User ko dikhte hain
Learning purpose ke liye

Structure:

{
  input: String,
  explanation: String
}
🔒 Hidden Test Cases
User ko nahi dikhte
Final evaluation ke liye use hote hain

Structure:

{
  input: String,
  output: String
}
💻 4. Code Support System
🟢 Start Code
Default template jo user ko diya jata hai
Multi-language support
{
  language: String,
  initialCode: String
}
🟣 Reference Solution
Correct solution stored hota hai
Validation aur debugging ke liye useful
{
  language: String,
  completeCode: String
}
👨‍💻 5. Problem Creator
problemCreator: {
  type: Schema.Types.ObjectId,
  ref: "user"
}

👉 Ye track karta hai:

Kis admin ne problem create ki
⚡ 6. Code Execution using Judge0
📌 Introduction

Judge0 ek external API hai jo user ke code ko:

Compile karta hai
Execute karta hai
Output return karta hai
🔤 7. Language Mapping
const language = {
  "c++": 54,
  "java": 62,
  "javascript": 63
}

👉 Har language ka ek unique ID hota hai (Judge0 ke liye)

📤 8. Batch Submission System
Function: submitBatch()
Multiple test cases ek sath execute hote hain
Efficient processing
Flow:
Submissions array banaya
Judge0 API ko send kiya
Output receive kiya
🔁 9. Complete Execution Flow
User → Backend → Judge0 API → Execution → Output → Backend → Response

⚙️ 10. Technologies Used
Node.js
Express.js
MongoDB
Mongoose
JWT (Authentication)
Redis (Token Blocking)
Axios (API calls)
Judge0 API
📚 Key Learnings
Real-world schema design ka importance
Nested objects and arrays handling
External API integration
Code execution systems ka working
Multi-language support implementation
⚠️ Challenges Faced
Complex schema structure design
Judge0 API samajhna
Async API calls handle karna
Test case structure plan karna
✅ Outcome

✔️ Admin can create coding problems
✔️ Structured DB schema ready
✔️ Code execution system integrated
✔️ Multi-language support implemented