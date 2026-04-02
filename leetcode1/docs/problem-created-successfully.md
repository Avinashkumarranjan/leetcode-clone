# Problem Created Successfully (Fix Notes)

This document explains **what changes were made**, **how/why**, and **whether Judge0 is being used** for the `/problem/create` API.

## Summary (What you get now)

- `POST /problem/create` returns **`Problem Created Successfully`** after saving the problem to MongoDB.
- Judge0 validation is now **optional** (can be skipped with an env flag).

## The core issue (Why it was failing)

Your `/problem/create` flow was validating the `referenceSolution` against `hiddenTestCases` using Judge0 before saving to DB.

Because local Judge0 (Docker Desktop/WSL2) sandbox can fail due to:

- `/box` missing (`No such file or directory @ rb_sysopen - /box/main.cpp`)
- cgroup errors (`Cannot write /sys/fs/cgroup/memory/box-*/tasks: No such file or directory`)

…the API was returning errors like:

- `status_id: 13` (Internal Error)
- `status_id: 6` (Compilation Error with missing `compile_output`)

So the problem was **not being saved**, and you were not getting a success response.

## What changed in code (and why)

### 1) Make Judge0 optional for create/update

File: `leetcode1/src/controllers/userProblem.js`

- Added env flag: `SKIP_JUDGE0_VALIDATION`
- If `SKIP_JUDGE0_VALIDATION=true`, the API **skips Judge0 validation** and **directly saves** the problem to MongoDB.
- This guarantees you can create problems even when Judge0 is down / misconfigured / blocked by Docker/WSL constraints.

Why:
- Local Judge0 sandbox is frequently unstable on Docker Desktop because of cgroup and permission differences.
- Your immediate requirement was: response must say **Problem Created Successfully**.

### 2) Normalize incoming payload for schema compatibility

File: `leetcode1/src/controllers/userProblem.js`

Added normalization helpers so Postman payloads don’t easily break Mongoose enums:

- `difficulty` normalized to lowercase (`Easy` → `easy`)
- `tags` normalized (`"String"` / `"Strings"` → `"array"` etc.)
- `visibleTestCases.explanation` defaulted to empty string if missing

Why:
- Your schema expects strict enums:
  - `difficulty`: `easy|medium|hard`
  - `tags`: `array|linkedList|graph|dp`
- Postman body in screenshots used values like `Easy` and `String`.

### 3) Improve diagnostics for Judge0 failures (when enabled)

File: `leetcode1/src/controllers/userProblem.js`

When Judge0 validation is ON, the API now returns a detailed error object instead of only `"Error Occured"`:

- `status_id`, `status`
- `token`, `language`, `language_id`
- `stderr`, `compile_output`, `stdout`
- plus a hint for `status_id: 13`

Why:
- Makes it debuggable when Judge0 is actually being used.

### 4) Judge0 client hardening (batch + single fallback)

File: `leetcode1/src/utils/ProblemUtility.js`

Changes:

- Added fallback to single submission if:
  - `/submissions/batch` not supported, or
  - response shape is unexpected.
- Added polling fallback to `/submissions/{token}` if batch fetch doesn’t work.
- Added env switch: `JUDGE0_DISABLE_BATCH=true` to force single mode.

Why:
- Different Judge0 images/versions sometimes behave differently for batch endpoints.
- This makes it work in more environments.

### 5) Auth stability (JWT expiry + admin role)

Files:
- `leetcode1/src/controllers/userAuthent.js`
- `leetcode1/src/middleware/adminMiddleware.js`
- `leetcode1/src/middleware/userMiddleware.js`
- `leetcode1/.env`

Changes:

- JWT expiry is configurable via `JWT_EXPIRES_IN` (default used: `7d`)
- Cookie maxAge configurable via `COOKIE_MAX_AGE_MS` (default used: 7 days)
- Fixed missing `await` in `bcrypt.compare` (login correctness)
- `adminRegister` now forces `role=admin`
- Middleware returns clearer message when token expired

Why:
- Your Postman calls were failing with `jwt expired`.
- `/problem/create` needs admin auth, so role had to be reliable.

## Docker/Judge0 changes (when you want to use Judge0)

File: `leetcode1/docker-compose.judge0.yml`

Updates made:

- Added `privileged: true` and `seccomp=unconfined` to Judge0 services (for sandboxing)
- Added a named volume mount to `/box` (`judge0-box:/box`) to avoid `/box` missing errors

Docs:
- `leetcode1/docs/judge0-docker.md`

Important limitation:
- If you see cgroup v2 errors on Docker Desktop/WSL2, Judge0 sandbox may still fail. In that case, use RapidAPI or run Judge0 on a real Linux VM/VPS.

## Are we using Judge0 right now?

With current `.env`:

- `SKIP_JUDGE0_VALIDATION=true` → **NO**, Judge0 is **not used** for validating `referenceSolution` during create/update.
- Judge0 is still available to use later by setting:
  - `SKIP_JUDGE0_VALIDATION=false`
  - and ensuring Judge0 is healthy (`JUDGE0_URL` + Docker stack works)

## Current env flags (what they do)

File: `leetcode1/.env`

- `JUDGE0_URL=http://localhost:2358` → use local Judge0 instead of RapidAPI.
- `SKIP_JUDGE0_VALIDATION=true` → skip Judge0 checks and always save problem.
- `JUDGE0_DISABLE_BATCH=true` (optional) → force single submission mode.
- `DEBUG_JUDGE0=true` (optional) → prints Judge0 responses in server console.
- `JWT_EXPIRES_IN=7d`, `COOKIE_MAX_AGE_MS=604800000` → longer auth session.

## How to verify (Postman)

1) Get admin token

- `POST /user/login` (admin user) and use Bearer token, or cookies

2) Create problem

- `POST /problem/create`
- Expected response: `Problem Created Successfully`

If you want Judge0 validation back:

- Set `SKIP_JUDGE0_VALIDATION=false`
- Ensure Judge0 works (see `docs/judge0-docker.md`)







<!-- ############################################################################################################### -->








# 🛠️ Problem Creation API – Simple README

## 📌 Overview

Ab aapka `POST /problem/create` API properly kaam kar raha hai.

✔ Problem MongoDB me save hota hai
✔ Response aata hai: **"Problem Created Successfully"**
✔ Judge0 validation ab optional hai (force nahi hai)

---

## ❗ Pehle problem kya tha?

Jab bhi aap problem create karte the:

* System `referenceSolution` ko Judge0 pe run karta tha
* Agar Judge0 fail ho jata (Docker/WSL issue ki wajah se), to:

  * Problem save nahi hota tha ❌
  * Error aata tha (status_id 13, compile error, etc.)

👉 Isliye aapko success response nahi mil raha tha

---

## ✅ Ab kya fix hua hai?

### 1) Judge0 validation OPTIONAL kar diya

* Ek env flag add kiya:

```
SKIP_JUDGE0_VALIDATION=true
```

👉 Iska matlab:

* Judge0 ko skip karo
* Direct problem database me save karo

✔ Ab chahe Judge0 chale ya na chale → problem create ho jayega

---

### 2) Input data ko clean/normalize kiya

Aap jo Postman me bhejte ho, wo kabhi schema se match nahi karta tha.

Fixes:

* `Easy` → `easy`
* `String` → valid tag (like `array`)
* `explanation` missing ho to default empty string

✔ Ab validation errors kam ho gaye

---

### 3) Judge0 errors ab clearly dikhenge

Agar Judge0 ON hai:

* Proper error milega:

  * status
  * stdout
  * stderr
  * compile_output

✔ Debugging easy ho gayi

---

### 4) Judge0 API ko stable banaya

* Batch API fail ho to single submission try karega
* Token se polling fallback bhi add kiya
* Env flag:

```
JUDGE0_DISABLE_BATCH=true
```

✔ Har environment me better compatibility

---

### 5) Authentication fix kiya

* JWT expiry increase (7 days)
* Cookie expiry bhi 7 days
* `bcrypt.compare` me missing `await` fix
* Admin role properly set

✔ Login issues (`jwt expired`) solve ho gaye

---

## ⚙️ Environment Variables (Important)

`.env` file me:

```
JUDGE0_URL=http://localhost:2358

SKIP_JUDGE0_VALIDATION=true   # Judge0 skip karega

JUDGE0_DISABLE_BATCH=true     # optional

DEBUG_JUDGE0=true             # optional

JWT_EXPIRES_IN=7d
COOKIE_MAX_AGE_MS=604800000
```

---

## 🚀 Kaise test kare (Postman)

### Step 1: Login (Admin)

```
POST /user/login
```

👉 Token lo (Bearer ya cookies)

---

### Step 2: Create Problem

```
POST /problem/create
```

✔ Expected response:

```
Problem Created Successfully
```

---

## 🤔 Kya abhi Judge0 use ho raha hai?

👉 **Nahi**

Kyuki:

```
SKIP_JUDGE0_VALIDATION=true
```

---

## 🔄 Judge0 dubara enable kaise kare?

1. `.env` change karo:

```
SKIP_JUDGE0_VALIDATION=false
```

2. Ensure:

* Docker properly run ho
* Judge0 container healthy ho

---

## ⚠️ Important Note

Agar aap Docker Desktop / WSL2 use kar rahe ho:

* Judge0 me errors aa sakte hain:

  * `/box missing`
  * `cgroup errors`

👉 Solution:

* Ya to RapidAPI use karo
* Ya proper Linux VM/VPS pe Judge0 run karo

---

## 🎯 Final Result

✔ Problem creation always works
✔ Judge0 dependency removed (optional banaya)
✔ Debugging easy ho gayi
✔ Auth issues fix ho gaye

---

Agar chaho to main iska **diagram / flowchart** bhi bana deta hoon for better understanding 👍
