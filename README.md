# Enterprise MVC Session & Authorization Engine (`Project Elmestar`)

> **Node.js • Express • PostgreSQL • Passport.js • Stateful Authentication**

A production-ready Server-Side Rendered (SSR) Model-View-Controller (MVC) backend architecture built to demonstrate persistent session management, relational data modeling, role-based authorization, and dynamic search engine indexing.

---

## 🏛️ System Architecture & Backend Highlights

While originally built as a domain platform for educator discovery, the core codebase serves as a blueprint for **monolithic, high-throughput Node.js backend systems**:

* **Stateful Session Persistence:** Implemented `express-session` with secure server-side session persistence in PostgreSQL (`connect-pg-simple`), featuring HTTP-only, `SameSite` cookies to mitigate XSS and session hijacking.
* **Authentication Pipeline:** Integrated `Passport.js` strategies with salted `bcrypt` password hashing, input sanitization, and structured login/registration pipelines.
* **Role-Based Access Control (RBAC):** Custom Express middleware enforcing fine-grained route authorization and resource ownership between end-users, content creators, and platform administrators.
* **Relational Schema Design (PostgreSQL):** Normalized database architecture managed via `node-postgres` (`pg`) connection pooling, featuring transactional integrity, foreign key constraints, and indexed queries.
* **Programmatic SEO & Schema Generation:** Automated generation of dynamic `sitemap.xml` feeds and embedded JSON-LD (Structured Data) markup to optimize server-side rendered routes for search engine indexing.

---

## 🛠️ Tech Stack & Backend Libraries

### Core Runtime & Framework
* **Node.js:** Non-blocking, event-driven execution runtime.
* **Express.js:** HTTP pipeline, middleware chain, and routing controller layer.

### Database & Data Access
* **PostgreSQL:** Relational database handling persistent storage (Users, Entities, Reviews, Sessions).
* **`node-postgres` (`pg`):** Connection pool management for direct, parameterized SQL execution.

### Authentication & Security
* **Passport.js:** Modular authentication strategies.
* **`express-session`:** Session state management backed by persistent storage.
* **`bcrypt` / `bcryptjs`:** Cryptographic password salting and hashing.
* **`dotenv`:** Isolated runtime configuration and environment secret management.

### View Layer & Tooling
* **EJS (Embedded JavaScript):** Server-side view engine rendering dynamic HTML directly from Express controllers.
* **Google Tag Manager / Meta Pixel:** Server-to-client analytics tracking integration.

---

## 📂 Architecture Overview

```text
├── controllers/          # Business logic, SQL queries, & view rendering logic
├── middleware/           # RBAC authorization, session validation, & error handlers
├── config/               # Passport strategy configuration & DB pool initialization
├── routes/               # Modular Express route declarations
├── views/                # EJS template views
├── public/               # Static assets (CSS, client JS)
└── server.js             # Application entry point & middleware pipeline assembly
```

## 🚀 Local Development Setup

### 1. Clone the Repository
```bash
git clone https://github.com/emilmagdy/elmestar.git
cd elmestar
```
### 2.Install Dependencies
```bash
npm install
```
### 3.Configure Environment Variables

* Create a .env file in the root directory:
``` PORT=5000
DATABASE_URL=postgres://user:password@localhost:5432/elmestar_db
SESSION_SECRET=your_secure_random_session_secret
```
### 4.Start the Application
``` Bash
npm start
```


