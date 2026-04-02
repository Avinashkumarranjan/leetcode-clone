
---



```md
# 📅 Day 6+7: Problem Management + Submission System

---

## 🚀 Overview

Day 6 me maine backend ko almost complete bana diya:

- Problem update & delete APIs
- Problem fetching APIs
- Code submission system
- Judge0 optional execution system

---

## 🔐 1. Admin Problem Management

### Update Problem
- Existing problem ko modify kar sakte hain
- Fields update hote hain

### Delete Problem
- Problem database se remove hota hai

👉 Admin-only access via middleware

---

## 👤 2. User Problem Access

### Get All Problems
- Saare problems fetch hote hain

### Get Problem by ID
- Specific problem detail milta hai

👉 Authentication required

---

## 💻 3. Code Submission System

### API:POST /submit/:id



---

## 🔁 Submission Flow

1. User request bhejta hai
2. Token verify hota hai
3. Problem fetch hota hai
4. Submission DB me save hota hai (pending)
5. Execution decide hota hai

---

## ⚡ 4. Without Judge0 Execution

### Condition:
```js
SKIP_JUDGE0_EXECUTION=true



Behavior:
Code execute nahi hota
Direct result generate hota hai
status = "accepted"
testCasesPassed = total test cases

👉 Useful for:

Development
Testing without Docker
Fast response
🧠 5. With Judge0 Execution (Optional)
Steps:
Language ID map hota hai
Test cases ke liye submissions bante hain
Batch API call hota hai
Tokens receive hote hain
Results fetch hote hain
Output compare hota hai
📊 6. Result Evaluation Logic
status_id = 3 → success
status_id = 4 → wrong answer
else → error
📦 7. Submission Storage

Each submission contains:

userId
problemId
code
language
status
testCasesPassed
runtime
memory
errorMessage
⚙️ 8. Environment Variables
SKIP_JUDGE0_EXECUTION=true
SKIP_JUDGE0_VALIDATION=true
JUDGE0_DISABLE_BATCH=true
DEBUG_JUDGE0=true
📚 Key Learnings
Full backend flow of coding platform
CRUD operations for problems
Submission lifecycle management
Optional external API handling
Clean fallback system design
⚠️ Challenges
Judge0 setup issues (Docker/WSL)
Handling async execution
Designing fallback logic
Managing submission states
✅ Outcome

✔️ Backend is fully functional
✔️ Works without Judge0
✔️ Scalable design ready
✔️ Real-world architecture achieved