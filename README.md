# fileshare-gallery (Next.js + MySQL + MinIO)

A minimal, ready-to-run scaffold for a **file sharing + image gallery** web app.

## Features
- Next.js (App Router) with simple pages: public feed, gallery, upload, dashboard, admin, document viewer
- Auth.js (NextAuth v5) with **Credentials** and Prisma Adapter
- Prisma (MySQL) schema for users/files/galleries/shares
- MinIO (S3) integration with **presigned PUT** (upload) and **presigned GET** (for private galleries)
- Built-in document viewer for previewing Word, Excel, PowerPoint, and PDF documents stored in Storgbay
- Public-by-default galleries (requires enabling anonymous read on the MinIO bucket)

## Document viewer

- Open the dashboard and click **Open document viewer** (or visit `/documents`).
- Select a stored Office file (`.docx`, `.pptx`, `.xlsx`), a PDF, or a Google Docs link to load it in the embedded preview.
- Use the **Open original** button to launch the document in a dedicated tab if the embedded preview requires additional authentication.
- Download a copy of the original file at any time for offline access or editing in your preferred word processor.

## Local Setup (no Docker)
1. **MySQL**: create DB `fileshare` and user `app`/`apppass`; or update `DATABASE_URL`. If your MySQL user cannot create
   databases, also create a secondary schema (for example `fileshare_shadow`) and point `SHADOW_DATABASE_URL` to it so Prisma
   can run migrations without needing create-database permissions.
2. **MinIO**: run locally on `:9000`, create bucket `uploads`, optionally enable anonymous read for public galleries. Use the new root credentials (`MINIO_ROOT_USER=root` / `MINIO_ROOT_PASSWORD=<your-password>`) or mirror them via `S3_ACCESS_KEY`/`S3_SECRET_KEY` in your `.env` file. For production, you can reuse the main domain and expose MinIO through Nginx under `/storage`; see [`docs/nginx-minio-proxy.md`](docs/nginx-minio-proxy.md) for an example reverse proxy configuration that forwards to the MinIO server on port 9000.
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
noting security fixes
