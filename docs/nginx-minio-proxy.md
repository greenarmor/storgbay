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

## Why this works without CORS

When using the Nginx proxy, all browser requests (the app and file uploads/downloads) go to the same origin.
The browser never talks to MinIO directly, so no CORS configuration is needed on MinIO.

## Post-setup checklist

- [ ] MinIO running and bound to `127.0.0.1:9000` (not `0.0.0.0`)
- [ ] `uploads` bucket created in MinIO
- [ ] Anonymous read policy applied to the `uploads` bucket (for public gallery images)
- [ ] SSL certificate configured in Nginx
- [ ] `S3_INTERNAL_ENDPOINT`, `S3_PUBLIC_ENDPOINT`, `S3_FORCE_PATH_STYLE`, and `NEXTAUTH_URL` set in `.env`
- [ ] Restart Nginx after applying the configuration
- [ ] Remove any MinIO CORS settings if previously configured for localhost development
