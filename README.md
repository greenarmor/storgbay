# fileshare-gallery (Next.js + MySQL + MinIO)

A minimal, ready-to-run scaffold for a **file sharing + image gallery** web app.

## Features
- Next.js (App Router) with simple pages: public feed, gallery, upload, dashboard, admin, document studio
- Auth.js (NextAuth v5) with **Credentials** and Prisma Adapter
- Prisma (MySQL) schema for users/files/galleries/shares
- MinIO (S3) integration with **presigned PUT** (upload) and **presigned GET** (for private galleries)
- Built-in document studio for creating rich text docs, importing Word exports, and saving back to storage
- Public-by-default galleries (requires enabling anonymous read on the MinIO bucket)

## Document studio

- Open the dashboard and click **Open document studio** (or visit `/documents`).
- Use the toolbar to format rich text, insert headings, lists, quotes, and links.
- Import `.docx`, `.html`, or plain text exports directly. Drag files onto the editor or use the Import button.
- To bring in a Google Doc, download it as **Microsoft Word (.docx)** from Google Docs and upload the exported file.
- Save finished work straight to Storgbay storage as a Word document or download it locally for offline editing.

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
