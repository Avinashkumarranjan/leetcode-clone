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

