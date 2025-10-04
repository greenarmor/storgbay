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

export function isPdf(mime?: string | null, filename?: string | null): boolean {
  const normalizedMime = mime?.toLowerCase() ?? "";
  if (normalizedMime === "application/pdf") {
    return true;
  }

  const normalizedFilename = filename?.toLowerCase() ?? "";
  return normalizedFilename.endsWith(".pdf");
}

const DOCUMENT_MIME_TYPES = new Set([
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.template",
  "application/vnd.ms-word.document.macroenabled.12",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.template",
  "application/vnd.ms-excel.sheet.macroenabled.12",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.presentationml.slideshow",
  "application/vnd.ms-powerpoint.presentation.macroenabled.12",
  "application/pdf",
  "application/vnd.google-apps.document",
  "application/vnd.google-apps.presentation",
  "application/vnd.google-apps.spreadsheet",
  "text/plain",
  "text/csv",
  "text/tab-separated-values",
]);

const DOCUMENT_EXTENSIONS = new Set([
  "doc",
  "docx",
  "docm",
  "dot",
  "dotx",
  "rtf",
  "pdf",
  "xls",
  "xlsx",
  "xlsm",
  "xlsb",
  "xlt",
  "xltx",
  "csv",
  "tsv",
  "txt",
  "ppt",
  "pptx",
  "pptm",
  "pps",
  "ppsx",
  "ppsm",
  "odt",
  "odp",
  "ods",
  "gdoc",
  "gslides",
  "gsheet",
]);

export function isDocumentFile(mime?: string | null, filename?: string | null): boolean {
  const normalizedMime = mime?.toLowerCase() ?? "";
  if (DOCUMENT_MIME_TYPES.has(normalizedMime)) {
    return true;
  }

  const normalizedFilename = filename?.toLowerCase() ?? "";
  const extension = normalizedFilename.split(".").pop() ?? "";
  return DOCUMENT_EXTENSIONS.has(extension);
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
