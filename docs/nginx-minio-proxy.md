# Nginx reverse proxy for MinIO

The application is served behind Nginx while MinIO runs on the same host listening on port `9000`.
Keep MinIO bound to `127.0.0.1:9000` for internal access, then expose the `uploads` bucket through the public domain.

## Application environment

Use separate internal and public S3 endpoints:

```env
S3_INTERNAL_ENDPOINT=http://127.0.0.1:9000
S3_PUBLIC_ENDPOINT=https://yourdomain.example.com
S3_BUCKET=uploads
S3_FORCE_PATH_STYLE=true
NEXTAUTH_URL=https://yourdomain.example.com
```

With that configuration, server-side S3 operations use `127.0.0.1:9000`, while browser-facing presigned upload/download URLs
and public gallery URLs are generated as `https://yourdomain.example.com/uploads/<object-key>`.

Do **not** configure `S3_PUBLIC_ENDPOINT` as `https://yourdomain.example.com/uploads`; the bucket name is already added by the S3
path-style URL builder. Setting the public endpoint to the domain root prevents doubled paths such as `/uploads/uploads/...`.

## Nginx configuration

Add the following to the Nginx server block for your domain. The `/uploads/` location must appear before the catch-all app proxy
so that MinIO requests are matched first.

```nginx
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name yourdomain.example.com;

    ssl_certificate     /etc/ssl/certs/yourdomain.pem;
    ssl_certificate_key /etc/ssl/private/yourdomain.key;

    # MinIO bucket proxy.
    # Requests such as /uploads/user-id/file.png are forwarded to MinIO as
    # /uploads/user-id/file.png, where "uploads" is the bucket name.
    location /uploads/ {
        proxy_pass http://127.0.0.1:9000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Disable buffering to support streaming uploads/downloads.
        proxy_request_buffering off;
        proxy_buffering off;
        client_max_body_size 0;
    }

    # Next.js application
    location / {
        proxy_pass http://127.0.0.1:3999;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

# HTTP → HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.example.com;
    return 301 https://$host$request_uri;
}
```

## Canonical host: force `www` (strict)

Replace the blocks above with these to make `www.yourdomain.example.com` the only host that
serves the app. Nothing is served on the apex at all — the 443 apex block has no `location`s,
so every request is bounced, including `/uploads/…` and any Host the app did not generate.

```nginx
# 1. HTTP: send both names straight to the canonical host in a single hop.
#    The ACME carve-out matters: a server-level `return` runs in the rewrite phase, before
#    nginx picks a location, so a bare `return 301` here would also redirect
#    /.well-known/acme-challenge/ and break HTTP-01 certificate renewal. Put the redirect in
#    `location /` instead so the challenge route is reachable.
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.example.com www.yourdomain.example.com;

    location /.well-known/acme-challenge/ {
        root /var/www/html;   # same webroot certbot uses (--webroot)
    }

    location / {
        return 301 https://www.yourdomain.example.com$request_uri;
    }
}

# 2. HTTPS on the apex: redirect only, never proxy. Keep it free of locations so no
#    request can ever be answered here by accident.
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name yourdomain.example.com;

    ssl_certificate     /etc/ssl/certs/yourdomain.pem;   # must cover BOTH names
    ssl_certificate_key /etc/ssl/private/yourdomain.key;

    return 301 https://www.yourdomain.example.com$request_uri;
}

# 3. HTTPS on the canonical host: the real config (MinIO proxy + app).
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name www.yourdomain.example.com;

    ssl_certificate     /etc/ssl/certs/yourdomain.pem;
    ssl_certificate_key /etc/ssl/private/yourdomain.key;

    location /uploads/ {
        proxy_pass http://127.0.0.1:9000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_request_buffering off;
        proxy_buffering off;
        client_max_body_size 0;
    }

    location / {
        proxy_pass http://127.0.0.1:3999;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Run `nginx -t` before reloading, and point the application env at the **same** canonical
host or the redirect turns into a login/upload failure (see pitfalls below):

```env
NEXTAUTH_URL=https://www.yourdomain.example.com
S3_PUBLIC_ENDPOINT=https://www.yourdomain.example.com
```

Use `return 301` (not `308`) for the host redirect: these are `GET` navigations, and a 301 is
cacheable by browsers, which is what you want for a permanent canonical choice.

## Why this works without CORS

When using the Nginx proxy, all browser requests (the app and file uploads/downloads) go to the same origin.
The browser never talks to MinIO directly, so no CORS configuration is needed on MinIO.

## Post-setup checklist

- [ ] MinIO running and bound to `127.0.0.1:9000` (not `0.0.0.0`)
- [ ] `uploads` bucket created in MinIO
- [ ] Anonymous read policy applied to the `uploads` bucket (for public gallery images)
- [ ] SSL certificate configured in Nginx
- [ ] `S3_INTERNAL_ENDPOINT`, `S3_PUBLIC_ENDPOINT`, `S3_FORCE_PATH_STYLE`, and `NEXTAUTH_URL` set in `.env`
- [ ] Certificate covers **both** the canonical and the redirected name (`certbot certonly --nginx -d www.yourdomain.example.com -d yourdomain.example.com`)
- [ ] `S3_PUBLIC_ENDPOINT` and `NEXTAUTH_URL` both use the canonical host, not the redirected one
- [ ] Apex returns `301` and nothing else: `curl -sI https://yourdomain.example.com/dashboard | head -1` → `301`, and `curl -sI https://yourdomain.example.com/uploads/whatever | head -1` → `301`
- [ ] Restart Nginx after applying the configuration
- [ ] Remove any MinIO CORS settings if previously configured for localhost development

## Common pitfalls

### The certificate must cover the exact host in `S3_PUBLIC_ENDPOINT`

Browser-facing image URLs are `https://<S3_PUBLIC_ENDPOINT-host>/uploads/<key>`, so that host is fetched
over its own TLS connection. If the certificate covers `www.example.com` but `S3_PUBLIC_ENDPOINT` is
`https://example.com` (or vice versa), every image fails with
`net::ERR_CERT_COMMON_NAME_INVALID` while the page itself loads normally on the host the certificate
does cover. Check what the certificate actually contains:

```bash
openssl s_client -connect example.com:443 -servername example.com </dev/null 2>/dev/null \
  | openssl x509 -noout -subject -ext subjectAltName
```

Issue one lineage covering both names (`certonly` leaves hand-written server blocks alone):

```bash
sudo certbot certonly --nginx -d www.example.com -d example.com
```

Then make one host canonical and redirect the other (see "Canonical host: force `www`" above), and
use that same canonical host in `S3_PUBLIC_ENDPOINT` and `NEXTAUTH_URL`.

### A canonical-host redirect breaks presigned uploads signed for the other host

Presigned URLs carry an AWS SigV4 signature computed over the `Host` header, and the Nginx
MinIO block passes the request host through with `proxy_set_header Host $host`. So a presigned URL
for the apex that gets `301`-ed to `www` arrives at MinIO with a different host than the one that was
signed, and MinIO answers `SignatureDoesNotMatch` — the upload fails even though the URL is valid
and unexpired.

The fix is not to exempt `/uploads/` from the redirect (that would leave the apex serving MinIO
directly, and a cross-origin `PUT` would then need CORS on MinIO). Set
`S3_PUBLIC_ENDPOINT=https://www.yourdomain.example.com` so the app mints upload and download URLs
on the canonical host and no redirect is ever involved.

Existing image URLs that were generated against the apex keep working after the switch: public
bucket reads are anonymous, so following the 301 to `www` is harmless.

### Do not point `S3_PUBLIC_ENDPOINT` at a port

`S3_PUBLIC_ENDPOINT=https://example.com:9000` sends the browser straight to MinIO, bypassing Nginx, and
MinIO's default self-signed certificate fails with the same `ERR_CERT_COMMON_NAME_INVALID`. Keep MinIO's
port out of the public endpoint.

### `client_max_body_size` caps presigned uploads

Presigned `PUT` URLs are `https://<host>/uploads/<key>`, so uploads travel through `location /uploads/`.
A `client_max_body_size 100M` there rejects anything larger with `413`. Use `client_max_body_size 0` for
that location (the uploads route enforces its own limits) and rely on `proxy_request_buffering off` so
large files stream instead of being spooled to disk.

