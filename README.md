# fileshare-gallery (Next.js + MySQL + MinIO)

A minimal, ready-to-run scaffold for a **file sharing + image gallery** web app.

## Features
- Next.js (App Router) with simple pages: public feed, gallery, upload, dashboard, admin
- Auth.js (NextAuth v5) with **Credentials** and Prisma Adapter
- Prisma (MySQL) schema for users/files/galleries/shares
- MinIO (S3) integration with **presigned PUT** (upload) and **presigned GET** (for private galleries)
- Public-by-default galleries (requires enabling anonymous read on the MinIO bucket)

## Local Setup (no Docker)
1. **MySQL**: create DB `fileshare` and user `app`/`apppass`; or update `DATABASE_URL`.
2. **MinIO**: run locally on `:9000`, create bucket `uploads`, optionally enable anonymous read for public galleries.
3. Copy env and install deps:
```bash
cp .env.example .env
pnpm i          # or npm i / yarn
pnpm db:migrate
pnpm db:seed
pnpm dev
```
Open http://localhost:3000 and sign in at `/api/auth/signin` using the seeded admin env values.

> To make galleries **private**, remove anonymous read from the bucket and the app will serve files via short-lived presigned GETs when a gallery is private.
