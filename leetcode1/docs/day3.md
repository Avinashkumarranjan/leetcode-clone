
---

# 📝 docs/day3.md (Admin Version)

```md
# 📅 Day 3 Notes

## What I did:
- Implemented admin authentication middleware
- Verified JWT token from cookies
- Fetched admin from database
- Added role-based access control
- Checked Redis for blocked tokens

## Key Concepts:
- Middleware in Express
- JWT verification
- Role-based authentication (RBAC)
- Redis token blacklist

## Flow Understanding:
Request → Middleware → Token Verify → DB Check → Role Check → Redis Check → Response

## Learnings:
- How admin protected routes work
- Role-based access control
- Secure authentication system

## Challenges:
- Implementing role check
- Handling unauthorized access