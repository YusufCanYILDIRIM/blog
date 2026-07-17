# 📝 Modern Blog Platform

<p align="center">
  <strong>A modern, scalable, and production-ready blog platform built with Next.js, Express.js, Prisma, and PostgreSQL.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black?logo=next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript" />
  <img src="https://img.shields.io/badge/Express.js-Backend-000000?logo=express" />
  <img src="https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-Database-4169E1?logo=postgresql" />
  <img src="https://img.shields.io/badge/License-MIT-green" />
</p>

---

# 📖 Overview

Modern Blog Platform is a full-stack blogging application designed with scalability, maintainability, and security in mind.

The application follows a **decoupled architecture**, where the frontend and backend are developed independently and deployed to separate servers.

This architecture makes the project suitable for:

- Production deployments
- Mobile applications
- Future microservices
- Independent scaling
- CI/CD pipelines

---

# ✨ Features

## Authentication

- User Registration
- User Login
- Secure Logout
- JWT Authentication
- Refresh Tokens
- Email Verification
- Forgot Password
- Password Reset

---

## Blog

- Create Posts
- Edit Posts
- Delete Posts
- Draft Support
- Publish/Unpublish
- Rich Text Editor
- Image Upload

---

## Community

- Nested Comments
- Reply to Comments
- Like Posts
- User Profiles
- Notifications

---

## Search

- Full Text Search
- Categories
- Tags
- Filtering
- Pagination

---

## Administration

- Admin Dashboard
- User Management
- Comment Moderation
- Category Management
- Statistics

---

# 🏗 Architecture

```
                Browser
                   │
                   ▼
        Frontend (Next.js)
                   │
          REST API Requests
                   │
                   ▼
      Backend (Express.js API)
                   │
          Prisma ORM
                   │
                   ▼
            PostgreSQL
```

---

# 📁 Project Structure

```
blog-platform/

├── frontend/
│   ├── src/
│   ├── public/
│   ├── components/
│   ├── features/
│   ├── hooks/
│   ├── services/
│   ├── lib/
│   ├── types/
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middlewares/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── validators/
│   │   ├── config/
│   │   ├── utils/
│   │   └── types/
│   │
│   ├── prisma/
│   └── package.json
│
├── docs/
│
├── docker-compose.yml
│
└── README.md
```

---

# 🛠 Tech Stack

## Frontend

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Hook Form
- Zod
- TanStack Query
- Zustand
- Axios

---

## Backend

- Node.js
- Express.js
- TypeScript
- Prisma ORM
- PostgreSQL
- Redis
- JWT Authentication
- Cloudinary
- Resend
- Helmet
- CORS
- Multer
- Winston/Pino

---

# 🔒 Security

- JWT Authentication
- Refresh Tokens
- HttpOnly Cookies
- Rate Limiting
- Password Hashing (bcrypt)
- Input Validation
- CSRF Protection
- XSS Protection
- SQL Injection Protection (Prisma)
- Helmet Security Headers

---

# 🚀 Deployment

| Service | Platform |
|----------|----------|
| Frontend | Vercel / Cloudflare Pages |
| Backend | Railway / Render / VPS |
| Database | PostgreSQL (Neon / Supabase) |
| Redis | Upstash |
| Storage | Cloudinary |

---

# ⚙️ Getting Started

## Clone Repository

```bash
git clone https://github.com/your-username/blog-platform.git
```

---

## Frontend

```bash
cd frontend

npm install

npm run dev
```

---

## Backend

```bash
cd backend

npm install

npx prisma migrate dev

npm run dev
```

---

# 🗺 Roadmap

- [x] Project Planning
- [ ] Authentication
- [ ] User Profiles
- [ ] Blog CRUD
- [ ] Rich Text Editor
- [ ] Image Upload
- [ ] Nested Comments
- [ ] Likes
- [ ] Notifications
- [ ] Categories
- [ ] Search
- [ ] Admin Dashboard
- [ ] Monitoring
- [ ] Docker
- [ ] CI/CD
- [ ] Testing

---

# 📚 Documentation

Documentation will be available inside the **docs/** directory.

- Architecture
- API Documentation
- Database Design
- Deployment Guide
- Security Guide

---

# 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch

```bash
git checkout -b feature/new-feature
```

3. Commit your changes

```bash
git commit -m "feat: add new feature"
```

4. Push your branch

```bash
git push origin feature/new-feature
```

5. Open a Pull Request

---

# 📄 License

This project is licensed under the MIT License.

---

# ⭐ Support

If you find this project helpful, consider giving it a ⭐ on GitHub.

It helps others discover the project and motivates further development.
