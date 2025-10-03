# Nginx reverse proxy for MinIO

The application is expected to be served from `storgbay.online` while MinIO runs on the same host listening on port `9000`.
To expose MinIO through the same domain under `/storage`, add the following location block to the Nginx server that handles
`storgbay.online`.

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name storgbay.online;

    # Existing application proxy (Next.js)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # New MinIO proxy
    location /storage/ {
        proxy_pass http://127.0.0.1:9000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Disable buffering to support streaming uploads/downloads
        proxy_buffering off;
        client_max_body_size 0;
    }
}
```

> **Note:** The trailing slashes in `location /storage/` and `proxy_pass http://127.0.0.1:9000/;` ensure that request paths
> after `/storage/` are forwarded to MinIO unchanged (for example, `/storage/uploads/cat.png`).

Restart Nginx after reloading the configuration.
