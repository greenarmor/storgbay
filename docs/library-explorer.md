# Media Library Explorer

The consolidated media explorer powers the "My Files" modal and surfaces both uploaded files and managed galleries in a single feed. The UI now consumes a single `/api/library` endpoint rather than stitching together `/api/files` and `/api/galleries`.

## `/api/library`

Returns an array of discriminated union objects that describe either a file or a gallery the signed-in user can access.

```jsonc
[
  {
    "kind": "file",
    "id": "file_123",
    "filename": "banner.png",
    "mime": "image/png",
    "bytes": 204800,
    "createdAt": "2025-02-04T17:06:31.000Z",
    "url": "https://cdn.example.com/path/to/banner.png"
  },
  {
    "kind": "gallery",
    "id": "gal_456",
    "title": "Launch assets",
    "visibility": "PRIVATE",
    "ownerId": "user_789",
    "ownerLabel": "Jessie Smith",
    "role": "MANAGER",
    "itemCount": 12,
    "createdAt": "2025-01-12T10:11:05.000Z"
  }
]
```

### File items

File entries mirror the previous `/api/files` response with the addition of a `kind: "file"` discriminator. They always include a signed `url` property so previews continue to render immediately.

### Gallery items

Gallery entries surface ownership and visibility metadata that allow the UI to communicate access level. The `itemCount` field provides a lightweight hint at the folder size and is derived from the gallery's `items` relation.

## Client consumption

`FileManager` now hydrates from `/api/library` and derives file-only or gallery-only collections via `kind` checks. Selection and bulk actions continue to work against file IDs, while folder affordances live in the same grid layout for a unified browsing experience.
