# Foster.ai Backend Engineering Assignment: CRM System REST API

A production-grade, enterprise-ready Customer Relationship Management (CRM) REST API built for educational counselors and prospective student lead tracking. Engineered with **Node.js**, **Express.js**, **MongoDB (Mongoose)**, and **JWT authentication**.

---

## 📌 Executive Architecture & Highlights

This submission was designed from the ground up following Senior Software Development Engineer (SDE) design principles:

- **Clean Layered Architecture:** Complete separation of concerns:
  $$\text{Client} \longrightarrow \text{Routes} \longrightarrow \text{Middlewares} \longrightarrow \text{Controllers} \longrightarrow \text{Services} \longrightarrow \text{Models} \longrightarrow \text{MongoDB}$$
- **Atomic Concurrency Control (Race-Condition Free):** Solves the classic CRM race condition where two counselors attempt to claim the exact same lead simultaneously using MongoDB atomic `findOneAndUpdate` with state preconditions (`{ _id: leadId, isClaimed: false }`). Returns an explicit `HTTP 409 Conflict` on contention.
- **Enterprise Security:**
  - Password hashing via `bcryptjs` with auto-salting hooks.
  - JWT token-based sessionless authentication.
  - Security headers via `helmet` and CORS protection.
  - Public lead submission rate-limiting via `express-rate-limit` to prevent denial-of-service or lead spamming.
  - Input validation and schema sanitization via `Joi`.
- **Database Optimization:** Compound indexes on MongoDB collections (`{ isClaimed: 1, createdAt: -1 }` and `{ claimedBy: 1, claimedAt: -1 }`) for sub-millisecond query execution on high-volume queues.
- **Developer Experience (DX):**
  - **Interactive Swagger UI Documentation** served directly at `/api/docs`.
  - **Automated Test Suite** (17 comprehensive integration and concurrency tests via Jest & Supertest).
  - Ready-to-use **Postman Collection** (`postman_collection.json`).
  - One-command **Seed Script** (`npm run seed`) with realistic mock data.

---

## 📋 Acceptance Criteria Verification

| Requirement / Acceptance Criteria | Status | Implementation Details |
|---|:---:|---|
| **Employee Login / Register** | ✅ Complete | `POST /api/v1/auth/register` & `POST /api/v1/auth/login`. Returns signed JWT token with password field strictly sanitized. |
| **Public Enquiry Form (Zero-Auth)** | ✅ Complete | `POST /api/v1/leads/public-enquiry`. Accessible by anyone without auth. Includes rate limiting and validation. |
| **Fetch Unclaimed Leads** | ✅ Complete | `GET /api/v1/leads/unclaimed`. Authenticated counselors can view all public enquiries. Includes pagination & course filtering. |
| **Claim Leads** | ✅ Complete | `PATCH /api/v1/leads/:id/claim`. Atomically claims an enquiry, assigns to logged-in counselor, and removes it from the public feed. |
| **Fetch Claimed Leads by Logged-in User** | ✅ Complete | `GET /api/v1/leads/claimed`. Counselors only see enquiries they have personally claimed (Private queue). |
| **Database: Postgres / MySQL / MongoDB** | ✅ Complete | Implemented with MongoDB (Mongoose) with strict schema models and compound indexes. |
| **Express Framework & JWT** | ✅ Complete | Built on Express with modular routers, centralized error middleware, and Bearer JWT auth. |

---

## 🏗️ Directory Structure

```text
foster-crm-backend/
├── src/
│   ├── config/             # Environment configuration & MongoDB connection
│   │   ├── db.js
│   │   └── env.js
│   ├── controllers/        # Request handling and HTTP response mapping
│   │   ├── auth.controller.js
│   │   └── lead.controller.js
│   ├── docs/               # OpenAPI 3.0 specification
│   │   └── swagger.yaml
│   ├── middlewares/        # Authentication, validation, rate limiting & errors
│   │   ├── auth.middleware.js
│   │   ├── error.middleware.js
│   │   ├── rateLimiter.middleware.js
│   │   └── validate.middleware.js
│   ├── models/             # Mongoose schemas, hooks, and indexes
│   │   ├── lead.model.js
│   │   └── user.model.js
│   ├── routes/             # Express route definitions
│   │   ├── auth.routes.js
│   │   ├── lead.routes.js
│   │   └── index.js
│   ├── services/           # Core business logic & database transactions
│   │   ├── auth.service.js
│   │   └── lead.service.js
│   ├── utils/              # Standardized ApiError, ApiResponse & asyncHandler
│   │   ├── ApiError.js
│   │   ├── ApiResponse.js
│   │   └── asyncHandler.js
│   ├── validations/        # Joi input validation schemas
│   │   ├── auth.validation.js
│   │   └── lead.validation.js
│   ├── app.js              # Express app setup and middleware pipeline
│   └── server.js           # Server lifecycle & graceful shutdown
├── scripts/
│   └── seed.js             # Demo data populator
├── tests/
│   ├── auth.test.js        # Authentication integration test suite
│   ├── leads.test.js       # Lead operations integration test suite
│   ├── concurrency.test.js # High-concurrency race condition test suite
│   └── setup.js            # Jest test lifecycle hook
├── .env.example
├── jest.config.js
├── package.json
├── postman_collection.json # Exported Postman collection
└── README.md
```

---

## ⚡ Concurrency & Race Condition Deep Dive

### The Challenge
In a live CRM environment, multiple counselors view the public enquiries pool in real time. If two counselors click **"Claim"** on the same enquiry at the exact same millisecond:
- **Naive Implementation (Buggy):**
  ```javascript
  // ❌ VULNERABLE TO RACE CONDITIONS
  const lead = await Lead.findById(id);
  if (lead.isClaimed) throw new Error('Already claimed');
  lead.isClaimed = true;
  lead.claimedBy = req.user.id;
  await lead.save();
  ```
  Both requests read `isClaimed = false` before either saves, leading to one counselor silently overwriting the other.

### The Production SDE Solution
We leverage MongoDB's single-document atomicity via `findOneAndUpdate` with a compound filter:
```javascript
// ✅ ATOMIC & CONCURRENCY SAFE
const claimedLead = await Lead.findOneAndUpdate(
  {
    _id: leadId,
    isClaimed: false // Atomic predicate check
  },
  {
    $set: {
      isClaimed: true,
      claimedBy: counselorId,
      claimedAt: new Date(),
      status: 'CLAIMED'
    }
  },
  {
    returnDocument: 'after',
    runValidators: true
  }
).populate('claimedBy', 'name email role');

if (!claimedLead) {
  // If the atomic update matched 0 documents, verify if it was already claimed
  const existingLead = await Lead.findById(leadId).populate('claimedBy', 'name');
  if (!existingLead) throw new ApiError(404, 'Lead not found');
  throw new ApiError(409, `Conflict: Lead has already been claimed by ${existingLead.claimedBy.name}`);
}
```
*This behavior is validated in `tests/concurrency.test.js` where parallel requests are executed using `Promise.all()`.*

---

## 🚀 Quickstart & Setup Guide

### 1. Prerequisites
- **Node.js** v18+ (tested on Node.js v22.16)
- **MongoDB** running locally on default port `27017` or a MongoDB Atlas URI

### 2. Installation
```bash
git clone <repository_url>
cd foster-crm-backend
npm install
```

### 3. Environment Variables
Create a `.env` file based on `.env.example`:
```bash
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/foster_crm
JWT_SECRET=supersecret_foster_ai_crm_jwt_key_2026
JWT_EXPIRES_IN=7d
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
PUBLIC_LEAD_RATE_LIMIT_MAX=30
```

### 4. Seed Demo Data
Populate the database with demo counselors and realistic prospective leads:
```bash
npm run seed
```

**Pre-seeded Counselor Accounts:**
| Name | Email | Password | Role |
|---|---|---|---|
| Priya Sharma | `priya.sharma@foster.ai` | `Password123!` | counselor |
| Vikram Aditya | `vikram.aditya@foster.ai` | `Password123!` | counselor |

### 5. Start the Server
```bash
# Production mode
npm start

# Development mode (with live reload)
npm run dev
```

The server will start at `http://localhost:5000`.

---

## 📖 API Documentation & Testing

### Interactive Swagger UI
Open your browser and navigate to:
```
http://localhost:5000/api/docs
```
You can explore request schemas, execute endpoints, and authorize with Bearer tokens directly in the web UI.

### Postman Collection
Import `postman_collection.json` located in the root directory into Postman. It includes pre-configured environment variables and test scripts that automatically save JWT tokens on login/registration.

---

## 🧪 Automated Testing

Run the full automated test suite covering unit, integration, and concurrency scenarios:

```bash
npm test
```

### Test Coverage Highlights:
- **`tests/auth.test.js` (7 tests):**
  - Counselor registration & JWT token issuance.
  - Duplicate email collision handling (409 Conflict).
  - Joi schema validation rejections (400 Bad Request).
  - Credential verification & password hashing check.
  - Protected route access control (`/api/v1/auth/me`).
- **`tests/leads.test.js` (9 tests):**
  - Public enquiry submission without authentication.
  - Unauthenticated access prevention on protected CRM queues (401 Unauthorized).
  - Unclaimed leads feed pagination & course interest filtering.
  - Lead claiming workflow and status transition from `UNCLAIMED` to `CLAIMED`.
  - Private queue verification: Counselors only see leads assigned to their account.
- **`tests/concurrency.test.js` (1 test):**
  - Executes 3 simultaneous parallel claim requests on the exact same lead using `Promise.all`.
  - Asserts that exactly **one** counselor receives `200 OK`, while the remaining counselors receive `409 Conflict`.

---

## 📡 REST API Reference Summary

| Endpoint | Method | Auth | Description |
|---|---|:---:|---|
| `/api/v1/health` | `GET` | No | Service health check |
| `/api/v1/auth/register` | `POST` | No | Register new employee/counselor |
| `/api/v1/auth/login` | `POST` | No | Authenticate employee & get JWT |
| `/api/v1/auth/me` | `GET` | Yes | Get logged-in counselor profile |
| `/api/v1/leads/public-enquiry` | `POST` | No | Public enquiry form capture (Rate-limited) |
| `/api/v1/leads/unclaimed` | `GET` | Yes | Get all unclaimed public enquiries |
| `/api/v1/leads/claimed` | `GET` | Yes | Get leads claimed by current counselor |
| `/api/v1/leads/:id/claim` | `PATCH` | Yes | Claim a lead (Atomic & Concurrency-Safe) |
| `/api/v1/leads/:id` | `GET` | Yes | Get lead details (Privacy-enforced) |

---

## 👤 Author
Developed for the **Foster.ai Backend Developer Assignment (Final Round)**.

