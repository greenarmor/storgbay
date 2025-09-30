export function isImage(mime?: string | null): boolean {
  return !!mime && mime.startsWith("image/");
}

export function isAnimatedImage(mime?: string | null, filename?: string | null): boolean {
  const normalizedMime = mime?.toLowerCase() ?? null;
  if (normalizedMime === "image/gif") {
    return true;
  }

  const normalizedFilename = filename?.toLowerCase() ?? null;
  return normalizedFilename !== null && normalizedFilename.endsWith(".gif");
}

export function isVideo(mime?: string | null): boolean {
  return !!mime && mime.startsWith("video/");
}

export function isAudio(mime?: string | null): boolean {
  return !!mime && mime.startsWith("audio/");
}

export function isPdf(mime?: string | null): boolean {
  return mime === "application/pdf";
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes)) return "-";
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const idx = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, idx);
  return `${value.toFixed(value >= 10 || idx === 0 ? 0 : 1)} ${units[idx]}`;
}

export function formatDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
