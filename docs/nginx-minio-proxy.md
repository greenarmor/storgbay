# Nginx reverse proxy for MinIO

The application is expected to be served from `storgbay.online` while MinIO runs on the same host listening on port `9000`.
Keep MinIO bound to `127.0.0.1:9000` for internal access, then expose the `uploads` bucket through the public domain at
`https://storgbay.online/uploads/<object-key>`.

Use separate internal and public S3 endpoints in the application environment:

```env
S3_INTERNAL_ENDPOINT=http://127.0.0.1:9000
# S3_ENDPOINT is still supported as the internal endpoint if S3_INTERNAL_ENDPOINT is not set.
S3_PUBLIC_ENDPOINT=https://storgbay.online
S3_BUCKET=uploads
S3_FORCE_PATH_STYLE=true
```

With that configuration, server-side S3 operations use `127.0.0.1:9000`, while browser-facing presigned upload/download URLs
and public gallery URLs are generated as `https://storgbay.online/uploads/<object-key>`.

Add the following location block to the Nginx server that handles `storgbay.online`.

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name storgbay.online;

    # MinIO bucket proxy. This location must appear before the catch-all app proxy.
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

    # Existing application proxy (Next.js)
    location / {
        proxy_pass http://127.0.0.1:3999;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Do **not** configure `S3_PUBLIC_ENDPOINT` as `https://storgbay.online/uploads`; the bucket name is already added by the S3
path-style URL builder. Setting the public endpoint to the domain root prevents doubled paths such as `/uploads/uploads/...`.

Restart Nginx after reloading the configuration.
