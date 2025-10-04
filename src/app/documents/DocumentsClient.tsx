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
} from "react";
import { saveAs } from "file-saver";
import htmlDocx from "html-docx-js/dist/html-docx";

type StatusMessage = {
  tone: "info" | "success" | "warning" | "error";
  text: string;
};

type ImportOption = "docx" | "html" | "text" | "gdoc" | "unsupported";

const DEFAULT_DOCUMENT_TITLE = "Untitled document";
const DEFAULT_DOCUMENT_HTML =
  '<p class="doc-placeholder">Start typing or import a document to begin.</p>';

const MIME_DOCX =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const allowedTags = new Set([
  "a",
  "b",
  "blockquote",
  "br",
  "code",
  "div",
  "em",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "i",
  "li",
  "ol",
  "p",
  "pre",
  "s",
  "span",
  "strong",
  "sub",
  "sup",
  "u",
  "ul",
]);

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

    Array.from(el.attributes).forEach((attr) => {
      if (attr.name.startsWith("data-")) return;

      if (attr.name === "style") {
        const styles = attr.value
          .split(";")
          .map((s) => s.trim())
          .filter(Boolean)
          .filter((rule) => {
            const [prop] = rule.split(":");
            const allowedProps = [
              "text-align",
              "font-weight",
              "font-style",
              "text-decoration",
            ];
            return allowedProps.includes(prop.trim());
          });

        if (styles.length) {
          el.setAttribute("style", styles.join(";"));
        } else {
          el.removeAttribute("style");
        }
      } else {
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

  if (name.endsWith(".docx")) return "docx";
  if (name.endsWith(".gdoc")) return "gdoc";
  if (name.endsWith(".html") || file.type === "text/html") return "html";
  if (file.type.startsWith("text/")) return "text";

  return "unsupported";
}

function buildDocxHtml(content: string, title: string) {
  const safeTitle = title || DEFAULT_DOCUMENT_TITLE;
  return `<!DOCTYPE html><html><head><meta charset="utf-8" /><title>${safeTitle}</title></head><body>${content}</body></html>`;
}

export default function DocumentsClient() {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [documentTitle, setDocumentTitle] = useState(DEFAULT_DOCUMENT_TITLE);
  const [contentHtml, setContentHtml] = useState(DEFAULT_DOCUMENT_HTML);
  const [status, setStatus] = useState<StatusMessage | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!editorRef.current) return;
    const sanitized = sanitizeHtml(contentHtml);

    if (editorRef.current.innerHTML !== sanitized) {
      editorRef.current.innerHTML = sanitized;
    }
  }, [contentHtml]);

  const updateContentFromEditor = useCallback(() => {
    if (!editorRef.current) return;
    const sanitized = sanitizeHtml(editorRef.current.innerHTML);
    setContentHtml(sanitized || "<p><br/></p>");
  }, []);

  const handleInput = useCallback(() => {
    updateContentFromEditor();
  }, [updateContentFromEditor]);

  const handlePaste = useCallback(
    (event: ClipboardEvent<HTMLDivElement>) => {
      event.preventDefault();
      const htmlData = event.clipboardData.getData("text/html");
      const textData = event.clipboardData.getData("text/plain");
      const html = htmlData || plainTextToHtml(textData);
      const sanitized = sanitizeHtml(html);
      document.execCommand("insertHTML", false, sanitized);
      updateContentFromEditor();
    },
    [updateContentFromEditor],
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
          break;
        }
        case "html": {
          const text = await file.text();
          const sanitized = sanitizeHtml(text);
          setContentHtml(sanitized || DEFAULT_DOCUMENT_HTML);
          setDocumentTitle(file.name.replace(/\.html?$/i, ""));
          setStatus({ tone: "success", text: `Imported ${file.name}.` });
          break;
        }
        case "text": {
          const text = await file.text();
          const html = plainTextToHtml(text);
          setContentHtml(html || DEFAULT_DOCUMENT_HTML);
          setDocumentTitle(file.name.replace(/\.[^.]+$/, ""));
          setStatus({ tone: "success", text: `Converted ${file.name} to a rich text document.` });
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
  }, []);

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
    editorRef.current?.focus();
  }, []);

  const applyCommand = useCallback(
    (command: string, value?: string) => {
      focusEditor();
      document.execCommand(command, false, value ?? "");
      updateContentFromEditor();
    },
    [focusEditor, updateContentFromEditor],
  );

  const handleNewDocument = useCallback(() => {
    setDocumentTitle(DEFAULT_DOCUMENT_TITLE);
    setContentHtml(DEFAULT_DOCUMENT_HTML);
    setStatus({ tone: "info", text: "Started a fresh document." });
    focusEditor();
  }, [focusEditor]);

  const handleDownloadDocx = useCallback(() => {
    const html = buildDocxHtml(contentHtml, documentTitle);
    const blob = htmlDocx.asBlob(html);
    const filename = `${documentTitle || DEFAULT_DOCUMENT_TITLE}.docx`;
    saveAs(blob, filename);
    setStatus({ tone: "success", text: `Downloaded ${filename}.` });
  }, [contentHtml, documentTitle]);

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
      const html = buildDocxHtml(contentHtml, documentTitle);
      const blob = htmlDocx.asBlob(html);
      const filenameBase = documentTitle?.trim() || DEFAULT_DOCUMENT_TITLE;
      const filename = filenameBase.endsWith(".docx") ? filenameBase : `${filenameBase}.docx`;
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
  }, [contentHtml, documentTitle, requestPresignedUpload]);

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
  }, [focusEditor, updateContentFromEditor]);

  const handleClearFormatting = useCallback(() => {
    applyCommand("removeFormat");
  }, [applyCommand]);

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
          <button className="drive-button-muted" onClick={handleDownloadDocx}>
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

        <div className="document-toolbar">
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
        </div>
      </section>

      <section className="document-editor">
        <div
          ref={editorRef}
          className="document-editor__canvas"
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onPaste={handlePaste}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        />
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
