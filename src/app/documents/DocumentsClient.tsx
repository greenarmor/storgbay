"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type DragEvent,
  type CSSProperties,
} from "react";
import { saveAs } from "file-saver";
import htmlToDocx from "html-to-docx";

type StatusMessage = {
  tone: "info" | "success" | "warning" | "error";
  text: string;
};

type ImportOption = "docx" | "html" | "text" | "gdoc" | "unsupported";

type InitialDocument = { id: string; filename: string; url: string };

export type DocumentsClientProps = {
  initialDocument?: InitialDocument | null;
  initialStatus?: StatusMessage | null;
};

const DEFAULT_DOCUMENT_TITLE = "Untitled document";
const DEFAULT_DOCUMENT_HTML =
  '<p class="doc-placeholder">Start typing or import a document to begin.</p>';

const PAGE_SIZES = [
  { id: "a4", label: "A4", widthMm: 210, heightMm: 297 },
  { id: "letter", label: "Letter", widthMm: 215.9, heightMm: 279.4 },
  { id: "legal", label: "Legal", widthMm: 215.9, heightMm: 355.6 },
] as const;

const DEFAULT_PAGE_SIZE = PAGE_SIZES[0];

const PAGE_GAP_PX = 48;

const MM_PER_INCH = 25.4;
const SCREEN_DPI = 96;
const MIN_PAGE_SCALE = 0.5;

const MIME_DOCX =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const SUPPORTED_DOCX_IMAGE_TYPES = new Set([
  "image/apng",
  "image/avif",
  "image/bmp",
  "image/gif",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/svg+xml",
  "image/tiff",
  "image/webp",
  "image/x-icon",
  "image/vnd.microsoft.icon",
]);

const normalizeMime = (value: string) => value.trim().toLowerCase();

const isSupportedDocxImageMime = (mime: string) => {
  if (!mime) return false;
  const normalized = normalizeMime(mime);

  if (SUPPORTED_DOCX_IMAGE_TYPES.has(normalized)) {
    return true;
  }

  if (normalized.startsWith("image/")) {
    // Some browsers report vendor-specific subtypes (e.g. image/pjpeg).
    const simplified = normalized.replace(/^image\/(x-)?/, "image/");
    return SUPPORTED_DOCX_IMAGE_TYPES.has(simplified);
  }

  return false;
};

const mmToPx = (mm: number) => (mm / MM_PER_INCH) * SCREEN_DPI;

const allowedTags = new Set([
  "a",
  "b",
  "blockquote",
  "br",
  "code",
  "col",
  "colgroup",
  "div",
  "em",
  "article",
  "aside",
  "figure",
  "figcaption",
  "caption",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "header",
  "footer",
  "hr",
  "i",
  "img",
  "li",
  "main",
  "nav",
  "ol",
  "p",
  "pre",
  "s",
  "section",
  "span",
  "strong",
  "sub",
  "sup",
  "table",
  "tbody",
  "td",
  "tfoot",
  "th",
  "thead",
  "tr",
  "u",
  "ul",
]);

const allowedGlobalAttributes = new Set([
  "style",
  "class",
  "title",
  "id",
  "role",
  "lang",
  "dir",
]);

const allowedAttributesByTag: Record<string, ReadonlySet<string>> = {
  img: new Set(["src", "alt", "title", "width", "height", "loading"]),
  table: new Set(["border", "cellpadding", "cellspacing", "summary"]),
  th: new Set(["colspan", "rowspan", "scope", "abbr", "align"]),
  td: new Set(["colspan", "rowspan", "headers", "align", "valign"]),
  col: new Set(["span", "width"]),
  colgroup: new Set(["span", "width"]),
  ol: new Set(["type", "start", "reversed"]),
  ul: new Set(["type"]),
  li: new Set(["value"]),
};

const allowedStyleProperties = new Set([
  "background",
  "background-color",
  "background-clip",
  "border",
  "border-bottom",
  "border-bottom-color",
  "border-bottom-style",
  "border-bottom-width",
  "border-collapse",
  "border-color",
  "border-left",
  "border-left-color",
  "border-left-style",
  "border-left-width",
  "border-right",
  "border-right-color",
  "border-right-style",
  "border-right-width",
  "border-spacing",
  "border-style",
  "border-top",
  "border-top-color",
  "border-top-style",
  "border-top-width",
  "border-width",
  "box-sizing",
  "caption-side",
  "color",
  "display",
  "float",
  "font-family",
  "font-feature-settings",
  "font-size",
  "font-style",
  "font-variant",
  "font-variant-caps",
  "font-variant-east-asian",
  "font-variant-ligatures",
  "font-variant-numeric",
  "font-variation-settings",
  "font-weight",
  "font-stretch",
  "font-kerning",
  "height",
  "letter-spacing",
  "line-height",
  "list-style-image",
  "list-style-position",
  "list-style-type",
  "margin",
  "margin-bottom",
  "margin-left",
  "margin-right",
  "margin-top",
  "max-height",
  "max-width",
  "min-height",
  "min-width",
  "opacity",
  "overflow",
  "overflow-x",
  "overflow-y",
  "padding",
  "padding-bottom",
  "padding-left",
  "padding-right",
  "padding-top",
  "table-layout",
  "text-align",
  "text-decoration",
  "text-decoration-color",
  "text-decoration-line",
  "text-decoration-style",
  "text-decoration-thickness",
  "text-indent",
  "text-shadow",
  "text-underline-offset",
  "text-underline-position",
  "text-transform",
  "vertical-align",
  "white-space",
  "width",
  "word-spacing",
]);

const FONT_FAMILIES: Array<{ label: string; value: string }> = [
  { label: "Arial", value: "Arial, Helvetica, sans-serif" },
  { label: "Calibri", value: '"Calibri", "Segoe UI", sans-serif' },
  { label: "Cambria", value: '"Cambria", "Times New Roman", serif' },
  { label: "Georgia", value: '"Georgia", "Times New Roman", serif' },
  { label: "Helvetica", value: '"Helvetica Neue", Helvetica, Arial, sans-serif' },
  { label: "Inter", value: '"Inter", "Segoe UI", sans-serif' },
  { label: "Times New Roman", value: '"Times New Roman", Times, serif' },
  { label: "Trebuchet", value: '"Trebuchet MS", "Lucida Grande", sans-serif' },
  { label: "Verdana", value: '"Verdana", Geneva, sans-serif' },
];

const FONT_SIZE_OPTIONS: Array<{ label: string; value: string }> = [
  { label: "Smallest", value: "1" },
  { label: "Small", value: "2" },
  { label: "Normal", value: "3" },
  { label: "Large", value: "4" },
  { label: "Larger", value: "5" },
  { label: "Extra large", value: "6" },
  { label: "Huge", value: "7" },
];

const DEFAULT_TEXT_COLOR = "#1f2937";
const DEFAULT_HIGHLIGHT_COLOR = "#fff59d";

function isAllowedAttribute(tag: string, attribute: string) {
  if (allowedGlobalAttributes.has(attribute)) return true;
  const allowedForTag = allowedAttributesByTag[tag];
  return allowedForTag?.has(attribute) ?? false;
}

function sanitizeStyleValue(rule: string) {
  const [propertyRaw, ...rest] = rule.split(":");
  if (!propertyRaw || rest.length === 0) return null;

  const property = propertyRaw.trim().toLowerCase();
  if (!allowedStyleProperties.has(property)) return null;

  const value = rest.join(":").trim();
  if (!value) return null;

  if (/expression\s*\(|javascript:/i.test(value)) {
    return null;
  }

  if (property === "background" && /url\s*\(/i.test(value)) {
    return null;
  }

  return `${property}: ${value}`;
}

function sanitizeHtml(html: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_ELEMENT);

  while (walker.nextNode()) {
    const el = walker.currentNode as HTMLElement;
    const tag = el.tagName.toLowerCase();

    if (!allowedTags.has(tag)) {
      const parent = el.parentNode;
      while (el.firstChild) {
        parent?.insertBefore(el.firstChild, el);
      }
      parent?.removeChild(el);
      continue;
    }

    if (tag === "a") {
      const href = el.getAttribute("href") ?? "";
      if (!href || href.startsWith("javascript:")) {
        el.removeAttribute("href");
      } else {
        el.setAttribute("target", "_blank");
        el.setAttribute("rel", "noreferrer noopener");
      }

      Array.from(el.attributes).forEach((attr) => {
        if (attr.name !== "href" && attr.name !== "target" && attr.name !== "rel") {
          el.removeAttribute(attr.name);
        }
      });
      continue;
    }

    if (tag === "img") {
      const src = el.getAttribute("src") ?? "";
      if (!src || !/^(data:|https?:|blob:)/i.test(src)) {
        el.remove();
        continue;
      }
    }

    Array.from(el.attributes).forEach((attr) => {
      if (attr.name.startsWith("data-") || attr.name.startsWith("aria-")) return;

      if (attr.name === "style") {
        const styles = attr.value
          .split(";")
          .map((s) => s.trim())
          .filter(Boolean)
          .map(sanitizeStyleValue)
          .filter((value): value is string => Boolean(value));

        if (styles.length) {
          el.setAttribute("style", styles.join("; "));
        } else {
          el.removeAttribute("style");
        }
      } else if (!isAllowedAttribute(tag, attr.name)) {
        el.removeAttribute(attr.name);
      }
    });
  }

  return doc.body.innerHTML || "";
}

function plainTextToHtml(input: string) {
  const lines = input.replace(/\r/g, "").split(/\n/);
  const paragraphs = lines.map((line) => {
    if (!line.trim()) {
      return "<p><br/></p>";
    }

    const escaped = line
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    return `<p>${escaped}</p>`;
  });
  return paragraphs.join("");
}

function detectImport(file: File): ImportOption {
  const name = file.name.toLowerCase();
  const type = file.type?.toLowerCase() ?? "";

  if (name.endsWith(".docx")) return "docx";
  if (name.endsWith(".gdoc")) return "gdoc";
  if (name.endsWith(".html") || type === "text/html") return "html";
  if (type.startsWith("text/")) return "text";

  return "unsupported";
}

function buildDocxHtml(content: string, title: string) {
  const safeTitle = title || DEFAULT_DOCUMENT_TITLE;
  return `<!DOCTYPE html><html><head><meta charset="utf-8" /><title>${safeTitle}</title></head><body>${content}</body></html>`;
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Unexpected FileReader result type"));
      }
    };
    reader.onerror = () => {
      reject(reader.error ?? new Error("Unable to read blob"));
    };
    reader.readAsDataURL(blob);
  });
}

async function inlineBlobImages(html: string) {
  if (typeof window === "undefined" || !html.includes("blob:")) {
    return html;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const images = Array.from(doc.querySelectorAll("img"));

  await Promise.all(
    images.map(async (img) => {
      const src = img.getAttribute("src") ?? "";
      if (!src.startsWith("blob:")) {
        return;
      }

      try {
        const response = await fetch(src);
        if (!response.ok) {
          throw new Error(`Failed to fetch blob URL (${response.status})`);
        }

        const blob = await response.blob();
        if (!blob.type || !isSupportedDocxImageMime(blob.type)) {
          img.remove();
          return;
        }

        const dataUrl = await blobToDataUrl(blob);
        img.setAttribute("src", dataUrl);
      } catch (error) {
        console.error("Failed to inline blob image for DOCX export", error);
        img.remove();
      }
    }),
  );

  return doc.body.innerHTML || "";
}

function removeUnsupportedDocxImages(html: string) {
  if (typeof window === "undefined" || !html.toLowerCase().includes("<img")) {
    return html;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const images = Array.from(doc.querySelectorAll("img"));

  images.forEach((img) => {
    const src = img.getAttribute("src") ?? "";

    if (!src) {
      img.remove();
      return;
    }

    if (src.startsWith("blob:")) {
      img.remove();
      return;
    }

    if (!src.startsWith("data:")) {
      return;
    }

    const match = /^data:([^;,]+)/i.exec(src);
    const mime = match?.[1] ?? "";

    if (!isSupportedDocxImageMime(mime)) {
      img.remove();
    }
  });

  return doc.body.innerHTML || "";
}

function createDocxBlob(output: unknown) {
  if (output instanceof Blob) {
    return output;
  }

  if (output instanceof ArrayBuffer) {
    return new Blob([output], { type: MIME_DOCX });
  }

  if (typeof ArrayBuffer !== "undefined" && ArrayBuffer.isView(output)) {
    const view = output as ArrayBufferView & { buffer: ArrayBufferLike };
    const { buffer, byteOffset, byteLength } = view;

    if (buffer instanceof ArrayBuffer) {
      const slice = buffer.slice(byteOffset, byteOffset + byteLength);
      return new Blob([slice], { type: MIME_DOCX });
    }

    if (typeof SharedArrayBuffer !== "undefined" && buffer instanceof SharedArrayBuffer) {
      const copy = new Uint8Array(byteLength);
      copy.set(new Uint8Array(buffer, byteOffset, byteLength));
      return new Blob([copy.buffer], { type: MIME_DOCX });
    }

    const copy = new Uint8Array(byteLength);
    copy.set(new Uint8Array(buffer, byteOffset, byteLength));
    return new Blob([copy.buffer], { type: MIME_DOCX });
  }

  throw new Error("Unsupported DOCX export format returned by converter.");
}

export default function DocumentsClient({
  initialDocument = null,
  initialStatus = null,
}: DocumentsClientProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Array<HTMLDivElement | null>>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const editorContainerRef = useRef<HTMLElement | null>(null);
  const lastLoadedDocumentId = useRef<string | null>(null);
  const [documentTitle, setDocumentTitle] = useState(DEFAULT_DOCUMENT_TITLE);
  const [contentHtml, setContentHtml] = useState(DEFAULT_DOCUMENT_HTML);
  const [status, setStatus] = useState<StatusMessage | null>(initialStatus ?? null);
  const [isSaving, setIsSaving] = useState(false);
  const [fontFamilySelection, setFontFamilySelection] = useState("");
  const [fontSizeSelection, setFontSizeSelection] = useState("");
  const [textColor, setTextColor] = useState(DEFAULT_TEXT_COLOR);
  const [highlightColor, setHighlightColor] = useState(DEFAULT_HIGHLIGHT_COLOR);
  const [showRuler, setShowRuler] = useState(false);
  const [pageScale, setPageScale] = useState(1);
  const [pageSizeId, setPageSizeId] = useState<(typeof PAGE_SIZES)[number]["id"]>(DEFAULT_PAGE_SIZE.id);
  const pageSize = useMemo(
    () => PAGE_SIZES.find((size) => size.id === pageSizeId) ?? DEFAULT_PAGE_SIZE,
    [pageSizeId],
  );
  const [pageCount, setPageCount] = useState(1);

  const pageWidthPx = useMemo(() => mmToPx(pageSize.widthMm), [pageSize.widthMm]);
  const pageHeightPx = useMemo(() => mmToPx(pageSize.heightMm), [pageSize.heightMm]);
  const workspaceStyle = useMemo(
    () =>
      ({
        "--document-page-width": `${pageWidthPx}px`,
        "--document-page-height": `${pageHeightPx}px`,
        "--document-page-scale": pageScale.toString(),
        "--document-page-width-scaled": `${pageWidthPx * pageScale}px`,
        "--document-page-height-scaled": `${pageHeightPx * pageScale}px`,
        "--document-page-count": pageCount.toString(),
        "--document-page-gap": `${PAGE_GAP_PX}px`,
        "--document-page-gap-scaled": `${PAGE_GAP_PX * pageScale}px`,
      }) as CSSProperties,
    [pageWidthPx, pageHeightPx, pageScale, pageCount],
  );

  const rulerMarks = useMemo(
    () => {
      const totalWidthMm = pageSize.widthMm;
      const marks: Array<{ key: string; position: number; label?: string; type: "major" | "mid" }> = [];
      const totalCentimetres = Math.round(totalWidthMm / 10);

      for (let cm = 0; cm <= totalCentimetres; cm += 1) {
        const position = (cm * 10) / totalWidthMm;
        marks.push({ key: `cm-${cm}`, position, label: `${cm}`, type: "major" });

        if (cm < totalCentimetres) {
          const midPosition = (cm * 10 + 5) / totalWidthMm;
          marks.push({ key: `half-${cm}`, position: midPosition, type: "mid" });
        }
      }

      return marks;
    },
    [pageSize.widthMm],
  );

  const recalculatePageCount = useCallback(() => {
    if (!Number.isFinite(pageHeightPx) || pageHeightPx <= 0) {
      setPageCount(1);
      return;
    }

    const pages = pageRefs.current.filter((page): page is HTMLDivElement => Boolean(page));

    if (pages.length === 0) {
      setPageCount(1);
      return;
    }

    let needsAnotherPass = false;

    for (let index = 0; index < pages.length; index += 1) {
      const page = pages[index];
      if (!page) continue;

      const nextPage = pages[index + 1] ?? null;

      while (page.scrollHeight > pageHeightPx && nextPage) {
        const childNodes = Array.from(page.childNodes);
        const nodeToMove = childNodes.pop();
        if (!nodeToMove) break;

        nextPage.insertBefore(nodeToMove, nextPage.firstChild);
        needsAnotherPass = true;
      }

      if (page.scrollHeight > pageHeightPx && !nextPage) {
        setPageCount((current) => current + 1);
        needsAnotherPass = true;
        return;
      }

      if (!nextPage) {
        continue;
      }

      while (page.scrollHeight < pageHeightPx && nextPage.childNodes.length > 0) {
        const nodeToMove = nextPage.firstChild;
        if (!nodeToMove) break;

        page.appendChild(nodeToMove);

        if (page.scrollHeight > pageHeightPx) {
          nextPage.insertBefore(nodeToMove, nextPage.firstChild);
          break;
        }

        needsAnotherPass = true;
      }
    }

    let lastIndexWithContent = -1;

    pages.forEach((page, index) => {
      if (page.innerHTML.trim()) {
        lastIndexWithContent = index;
      }
    });

    const pagesNeeded = Math.max(1, lastIndexWithContent + 1);
    setPageCount((current) => (current === pagesNeeded ? current : pagesNeeded));

    if (needsAnotherPass && typeof window !== "undefined") {
      window.requestAnimationFrame(() => {
        recalculatePageCount();
      });
    }
  }, [pageHeightPx]);

  const schedulePageCountRecalculation = useCallback(() => {
    if (typeof window === "undefined") return;

    window.requestAnimationFrame(() => {
      recalculatePageCount();
    });
  }, [recalculatePageCount]);

  useEffect(() => {
    recalculatePageCount();
  }, [recalculatePageCount, contentHtml, pageHeightPx, pageCount]);

  useEffect(() => {
    if (!editorRef.current) return;
    if (typeof ResizeObserver === "undefined") return;

    const element = editorRef.current;
    const observer = new ResizeObserver(() => {
      recalculatePageCount();
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, [recalculatePageCount]);

  useEffect(() => {
    if (!editorContainerRef.current) return;
    if (typeof ResizeObserver === "undefined") return;

    const element = editorContainerRef.current;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      const availableWidth = entry.contentRect.width;
      if (!Number.isFinite(availableWidth) || availableWidth <= 0) {
        return;
      }

      const proposedScale = availableWidth / pageWidthPx;
      const nextScale = Math.min(1, Math.max(proposedScale, MIN_PAGE_SCALE));

      setPageScale((current) => (Math.abs(current - nextScale) > 0.01 ? nextScale : current));
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, [pageWidthPx]);

  useEffect(() => {
    try {
      document.execCommand("styleWithCSS", false, "true");
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("styleWithCSS command is not supported", error);
      }
    }
  }, []);

  useEffect(() => {
    const sanitized = sanitizeHtml(contentHtml);
    const pages = pageRefs.current.filter((page): page is HTMLDivElement => Boolean(page));

    if (pages.length === 0) return;

    const existing = pages.map((page) => page.innerHTML).join("");

    if (existing !== sanitized) {
      pages.forEach((page, index) => {
        if (index === 0) {
          page.innerHTML = sanitized;
        } else {
          page.innerHTML = "";
        }
      });
    }

    schedulePageCountRecalculation();
  }, [contentHtml, schedulePageCountRecalculation]);

  const updateContentFromEditor = useCallback(() => {
    const pages = pageRefs.current.filter((page): page is HTMLDivElement => Boolean(page));
    if (pages.length === 0) return;

    const combinedHtml = pages.map((page) => page.innerHTML).join("");
    const sanitized = sanitizeHtml(combinedHtml);
    setContentHtml(sanitized || "<p><br/></p>");
  }, []);

  const handleInput = useCallback(() => {
    updateContentFromEditor();
    schedulePageCountRecalculation();
  }, [schedulePageCountRecalculation, updateContentFromEditor]);

  const handlePaste = useCallback(
    (event: ClipboardEvent<HTMLDivElement>) => {
      event.preventDefault();
      const htmlData = event.clipboardData.getData("text/html");
      const textData = event.clipboardData.getData("text/plain");
      const html = htmlData || plainTextToHtml(textData);
      const sanitized = sanitizeHtml(html);
      document.execCommand("insertHTML", false, sanitized);
      updateContentFromEditor();
      schedulePageCountRecalculation();
    },
    [schedulePageCountRecalculation, updateContentFromEditor],
  );

  const handleImport = useCallback(async (file: File) => {
    const importType = detectImport(file);

    try {
      switch (importType) {
        case "docx": {
          const { default: mammoth } = await import("mammoth/mammoth.browser");
          const arrayBuffer = await file.arrayBuffer();
          const { value } = await mammoth.convertToHtml({ arrayBuffer });
          const sanitized = sanitizeHtml(value);
          setContentHtml(sanitized || DEFAULT_DOCUMENT_HTML);
          setDocumentTitle(file.name.replace(/\.docx$/i, ""));
          setStatus({ tone: "success", text: `Imported ${file.name}.` });
          schedulePageCountRecalculation();
          break;
        }
        case "html": {
          const text = await file.text();
          const sanitized = sanitizeHtml(text);
          setContentHtml(sanitized || DEFAULT_DOCUMENT_HTML);
          setDocumentTitle(file.name.replace(/\.html?$/i, ""));
          setStatus({ tone: "success", text: `Imported ${file.name}.` });
          schedulePageCountRecalculation();
          break;
        }
        case "text": {
          const text = await file.text();
          const html = plainTextToHtml(text);
          setContentHtml(html || DEFAULT_DOCUMENT_HTML);
          setDocumentTitle(file.name.replace(/\.[^.]+$/, ""));
          setStatus({ tone: "success", text: `Converted ${file.name} to a rich text document.` });
          schedulePageCountRecalculation();
          break;
        }
        case "gdoc": {
          const text = await file.text();

          try {
            const data = JSON.parse(text) as { url?: string };

            if (data.url) {
              setStatus({
                tone: "warning",
                text:
                  "Google Docs shortcuts cannot be imported directly. Use File → Download → Microsoft Word (.docx) in Google Docs and import that file instead.",
              });
            } else {
              throw new Error("Unsupported Google Docs shortcut file.");
            }
          } catch {
            setStatus({
              tone: "warning",
              text:
                "This .gdoc file is a shortcut. Please export the document as .docx or .html from Google Docs and import that file.",
            });
          }

          break;
        }
        default: {
          setStatus({
            tone: "error",
            text: `${file.name} cannot be imported. Upload a .docx, .html, or text export instead.`,
          });
        }
      }
    } catch (error) {
      console.error(error);
      setStatus({
        tone: "error",
        text: error instanceof Error ? error.message : "Failed to import document.",
      });
    }
  }, [schedulePageCountRecalculation]);

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }, []);

  const handleDrop = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const [file] = Array.from(event.dataTransfer.files ?? []);
    if (file) {
      void handleImport(file);
    }
  }, [handleImport]);

  const focusEditor = useCallback(() => {
    const [firstPage] = pageRefs.current.filter((page): page is HTMLDivElement => Boolean(page));
    firstPage?.focus();
  }, []);

  useEffect(() => {
    if (!initialDocument) {
      lastLoadedDocumentId.current = null;
      return;
    }

    if (initialDocument.id === lastLoadedDocumentId.current) {
      return;
    }

    const controller = typeof AbortController === "function" ? new AbortController() : null;
    lastLoadedDocumentId.current = initialDocument.id;

    void (async () => {
      try {
        setStatus({ tone: "info", text: `Loading ${initialDocument.filename}…` });
        const response = await fetch(initialDocument.url, {
          signal: controller?.signal,
        });

        if (!response.ok) {
          throw new Error(`Failed to load document (${response.status})`);
        }

        const blob = await response.blob();
        if (controller?.signal.aborted) return;

        const mimeType = response.headers.get("Content-Type") ?? MIME_DOCX;
        const file = new File([blob], initialDocument.filename, { type: mimeType });

        await handleImport(file);
        focusEditor();
      } catch (error) {
        if (controller?.signal.aborted) return;
        console.error(error);
        setStatus({
          tone: "error",
          text:
            error instanceof Error
              ? error.message
              : "Unable to load the stored document. Try downloading it instead.",
        });
      }
    })();

    return () => controller?.abort();
  }, [initialDocument, handleImport, focusEditor]);

  const applyCommand = useCallback(
    (command: string, value?: string) => {
      focusEditor();
      document.execCommand(command, false, value ?? "");
      updateContentFromEditor();
      schedulePageCountRecalculation();
    },
    [focusEditor, schedulePageCountRecalculation, updateContentFromEditor],
  );

  const handleNewDocument = useCallback(() => {
    setDocumentTitle(DEFAULT_DOCUMENT_TITLE);
    setContentHtml(DEFAULT_DOCUMENT_HTML);
    setStatus({ tone: "info", text: "Started a fresh document." });
    focusEditor();
    schedulePageCountRecalculation();
  }, [focusEditor, schedulePageCountRecalculation]);

  const createDocxArtifact = useCallback(async () => {
    const trimmedTitle = documentTitle?.trim();
    const docTitle = trimmedTitle || DEFAULT_DOCUMENT_TITLE;
    const contentWithInlinedImages = await inlineBlobImages(contentHtml);
    const contentWithoutUnsupportedImages = removeUnsupportedDocxImages(contentWithInlinedImages);
    const html = buildDocxHtml(contentWithoutUnsupportedImages, docTitle);
    const lang = document.documentElement.lang?.trim();
    const docxOutput = await htmlToDocx(html, undefined, {
      title: docTitle,
      lang: lang || undefined,
    });

    return {
      blob: createDocxBlob(docxOutput),
      filename: docTitle.endsWith(".docx") ? docTitle : `${docTitle}.docx`,
    };
  }, [contentHtml, documentTitle]);

  const handleDownloadDocx = useCallback(async () => {
    try {
      const { blob, filename } = await createDocxArtifact();
      saveAs(blob, filename);
      setStatus({ tone: "success", text: `Downloaded ${filename}.` });
    } catch (error) {
      console.error(error);
      setStatus({
        tone: "error",
        text: error instanceof Error ? error.message : "Failed to download document.",
      });
    }
  }, [createDocxArtifact]);

  const requestPresignedUpload = useCallback(async (filename: string, size: number) => {
    const response = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename, mime: MIME_DOCX, size }),
    });

    if (!response.ok) {
      throw new Error((await response.text()) || "Unable to start upload.");
    }

    return response.json() as Promise<{ url: string }>;
  }, []);

  const handleSaveToStorage = useCallback(async () => {
    try {
      setIsSaving(true);
      const { blob, filename } = await createDocxArtifact();
      const { url } = await requestPresignedUpload(filename, blob.size);

      const uploadResponse = await fetch(url, {
        method: "PUT",
        body: blob,
        headers: { "Content-Type": MIME_DOCX },
      });

      if (!uploadResponse.ok) {
        throw new Error("Upload failed. Please try again.");
      }

      setStatus({ tone: "success", text: `Saved ${filename} to your storage.` });
    } catch (error) {
      console.error(error);
      setStatus({
        tone: "error",
        text:
          error instanceof Error ? error.message : "Failed to save document. Please retry shortly.",
      });
    } finally {
      setIsSaving(false);
    }
  }, [createDocxArtifact, requestPresignedUpload]);

  const onFileInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const [file] = Array.from(event.target.files ?? []);

      if (file) {
        void handleImport(file);
      }

      event.target.value = "";
    },
    [handleImport],
  );

  const toolbarButtons = useMemo(
    () => [
      { label: "Bold", command: "bold" },
      { label: "Italic", command: "italic" },
      { label: "Underline", command: "underline" },
      { label: "Strike", command: "strikeThrough" },
      { label: "Heading 1", command: "formatBlock", value: "<h1>" },
      { label: "Heading 2", command: "formatBlock", value: "<h2>" },
      { label: "Quote", command: "formatBlock", value: "<blockquote>" },
      { label: "Bullet list", command: "insertUnorderedList" },
      { label: "Numbered list", command: "insertOrderedList" },
      { label: "Align left", command: "justifyLeft" },
      { label: "Align center", command: "justifyCenter" },
      { label: "Align right", command: "justifyRight" },
    ],
    [],
  );

  const handleInsertLink = useCallback(() => {
    const url = window.prompt("Enter the URL", "https://");
    if (!url) return;

    focusEditor();
    document.execCommand("createLink", false, url);
    updateContentFromEditor();
    schedulePageCountRecalculation();
  }, [focusEditor, schedulePageCountRecalculation, updateContentFromEditor]);

  const handleClearFormatting = useCallback(() => {
    applyCommand("removeFormat");
  }, [applyCommand]);

  const handlePageSizeChange = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    setPageSizeId(event.target.value as (typeof PAGE_SIZES)[number]["id"]);
  }, []);

  const handleFontFamilyChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const value = event.target.value;
      setFontFamilySelection(value);

      if (value) {
        applyCommand("fontName", value);
        requestAnimationFrame(() => setFontFamilySelection(""));
      }
    },
    [applyCommand],
  );

  const handleFontSizeChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const value = event.target.value;
      setFontSizeSelection(value);

      if (value) {
        applyCommand("fontSize", value);
        requestAnimationFrame(() => setFontSizeSelection(""));
      }
    },
    [applyCommand],
  );

  const handleTextColorChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setTextColor(value);
      applyCommand("foreColor", value);
    },
    [applyCommand],
  );

  const handleHighlightColorChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setHighlightColor(value);

      focusEditor();

      let applied = false;

      try {
        if (typeof document.queryCommandSupported === "function" && document.queryCommandSupported("hiliteColor")) {
          applied = document.execCommand("hiliteColor", false, value);
        }
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("hiliteColor command is not supported", error);
        }
      }

      if (!applied) {
        try {
          document.execCommand("backColor", false, value);
        } catch (error) {
          if (process.env.NODE_ENV !== "production") {
            console.warn("backColor command is not supported", error);
          }
        }
      }

      updateContentFromEditor();
      schedulePageCountRecalculation();
    },
    [focusEditor, schedulePageCountRecalculation, updateContentFromEditor],
  );

  return (
    <div className="document-workspace">
      <header className="document-header">
        <div className="document-header__titles">
          <h1>Document studio</h1>
          <p>Create, import, and store polished documents without leaving Storgbay.</p>
        </div>
        <div className="document-header__actions">
          <button className="drive-button-muted" onClick={handleNewDocument}>
            New document
          </button>
          <button
            className="drive-button-muted"
            onClick={() => fileInputRef.current?.click()}
          >
            Import
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".docx,.html,.txt,.md,.gdoc,text/plain,text/html"
            className="sr-only"
            onChange={onFileInputChange}
          />
          <button className="drive-button-muted" onClick={() => void handleDownloadDocx()}>
            Download
          </button>
          <button
            className="drive-button-primary"
            onClick={() => void handleSaveToStorage()}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save to storage"}
          </button>
        </div>
      </header>

      <section className="document-controls">
        <label className="document-title-field">
          <span>Document title</span>
          <input
            value={documentTitle}
            onChange={(event) => setDocumentTitle(event.target.value)}
            placeholder="Name your document"
          />
        </label>

        <div className="document-controls__options">
          <label className="document-controls__page-size">
            <span>Page size</span>
            <select value={pageSizeId} onChange={handlePageSizeChange}>
              {PAGE_SIZES.map((size) => (
                <option key={size.id} value={size.id}>
                  {size.label} ({size.widthMm.toFixed(1).replace(/\.0$/, "")} × {size.heightMm.toFixed(1).replace(/\.0$/, "")} mm)
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="drive-button-ghost"
            onClick={() => setShowRuler((value) => !value)}
            aria-pressed={showRuler}
          >
            {showRuler ? "Hide ruler" : "Show ruler"}
          </button>
        </div>

        <div className="document-toolbar">
          <select
            className="document-toolbar__select"
            value={fontFamilySelection}
            onChange={handleFontFamilyChange}
          >
            <option value="">Font family</option>
            {FONT_FAMILIES.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            className="document-toolbar__select"
            value={fontSizeSelection}
            onChange={handleFontSizeChange}
          >
            <option value="">Font size</option>
            {FONT_SIZE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {toolbarButtons.map((button) => (
            <button
              key={button.label}
              type="button"
              className="document-toolbar__button"
              onClick={() => applyCommand(button.command, button.value)}
            >
              {button.label}
            </button>
          ))}
          <button type="button" className="document-toolbar__button" onClick={handleInsertLink}>
            Link
          </button>
          <button type="button" className="document-toolbar__button" onClick={handleClearFormatting}>
            Clear
          </button>
          <label className="document-toolbar__color" aria-label="Text color">
            <span>A</span>
            <input type="color" value={textColor} onChange={handleTextColorChange} />
          </label>
          <label className="document-toolbar__color" aria-label="Highlight color">
            <span className="document-toolbar__color-highlight">H</span>
            <input type="color" value={highlightColor} onChange={handleHighlightColorChange} />
          </label>
        </div>
      </section>

      <section className="document-editor" ref={editorContainerRef}>
        <div className="document-editor__workspace" style={workspaceStyle}>
          {showRuler && (
            <div className="document-ruler" aria-hidden="true">
              <div className="document-ruler__scale">
                {rulerMarks.map((mark) => (
                  <span
                    key={mark.key}
                    className={`document-ruler__tick document-ruler__tick--${mark.type}`}
                    style={{ left: `${mark.position * 100}%` }}
                  >
                    {mark.label ?? ""}
                  </span>
                ))}
              </div>
              <span className="document-ruler__unit">cm</span>
            </div>
          )}
          <div className="document-editor__page-wrapper">
            <div className="document-editor__page">
              <div className="document-editor__page-backgrounds" aria-hidden="true">
                {Array.from({ length: pageCount }).map((_, index) => (
                  <div
                    key={index}
                    className="document-editor__page-background"
                    style={{
                      top: `calc(${index} * (var(--document-page-height) + var(--document-page-gap)))`,
                    }}
                  />
                ))}
              </div>
              <div ref={editorRef} className="document-editor__canvas">
                {Array.from({ length: pageCount }).map((_, index) => (
                  <div
                    key={index}
                    ref={(element) => {
                      pageRefs.current[index] = element;
                    }}
                    className="document-editor__page-content"
                    contentEditable
                    suppressContentEditableWarning
                    style={{ height: `${pageHeightPx}px` }}
                    onInput={handleInput}
                    onPaste={handlePaste}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <aside className="document-help">
        <h2>Import tips</h2>
        <ul>
          <li>Drag in a Microsoft Word (.docx) export to keep headings and lists.</li>
          <li>From Google Docs use File → Download → Microsoft Word (.docx) and import that file here.</li>
          <li>Plain text files (.txt, .md) are converted into clean paragraphs automatically.</li>
        </ul>
      </aside>

      {status && (
        <div className={`document-status document-status--${status.tone}`}>
          {status.text}
        </div>
      )}
    </div>
  );
}
