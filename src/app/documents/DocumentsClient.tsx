"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export type StatusMessage = {
  tone: "info" | "success" | "warning" | "error";
  text: string;
};

type InitialDocument = { id: string; filename: string; url: string };

export type DocumentsClientProps = {
  initialDocument?: InitialDocument | null;
  initialStatus?: StatusMessage | null;
};

type ViewerInfo = {
  url: string;
  provider: "microsoft" | "google" | "direct";
};

const toneStyles: Record<StatusMessage["tone"], { background: string; color: string; border: string }> = {
  info: { background: "#e3f2fd", color: "#0d47a1", border: "#90caf9" },
  success: { background: "#e8f5e9", color: "#1b5e20", border: "#a5d6a7" },
  warning: { background: "#fff8e1", color: "#ff6f00", border: "#ffe082" },
  error: { background: "#ffebee", color: "#b71c1c", border: "#ef9a9a" },
};

function buildViewerInfo(document: InitialDocument): ViewerInfo {
  const sourceUrl = document.url;
  const lowerFilename = document.filename.toLowerCase();
  const isDocx = lowerFilename.endsWith(".docx");
  const isGoogleDocFile = lowerFilename.endsWith(".gdoc");
  const isGoogleDocLink = /docs\.google\.com\/(document|spreadsheets|presentation)/i.test(sourceUrl);

  if (isGoogleDocLink) {
    const previewUrl = sourceUrl.includes("/edit")
      ? sourceUrl.replace(/\/edit[^/?#]*/, "/preview")
      : sourceUrl;

    return { url: previewUrl, provider: "google" };
  }

  if (isDocx) {
    return {
      url: `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(sourceUrl)}`,
      provider: "microsoft",
    };
  }

  if (isGoogleDocFile) {
    return {
      url: `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(sourceUrl)}`,
      provider: "google",
    };
  }

  return { url: sourceUrl, provider: "direct" };
}

export default function DocumentsClient({
  initialDocument = null,
  initialStatus = null,
}: DocumentsClientProps) {
  const [currentDocument, setCurrentDocument] = useState<InitialDocument | null>(initialDocument ?? null);
  const [status, setStatus] = useState<StatusMessage | null>(initialStatus ?? null);

  useEffect(() => {
    setCurrentDocument(initialDocument ?? null);
  }, [initialDocument]);

  useEffect(() => {
    setStatus(initialStatus ?? null);
  }, [initialStatus]);

  const viewer = useMemo(() => {
    if (!currentDocument) return null;
    return buildViewerInfo(currentDocument);
  }, [currentDocument]);

  return (
    <div
      style={{
        display: "grid",
        gap: 24,
        padding: "32px 24px",
        maxWidth: 960,
        margin: "0 auto",
      }}
    >
      <header style={{ display: "grid", gap: 8 }}>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 600 }}>Document viewer</h1>
        <p style={{ margin: 0, color: "#4b5563", fontSize: 16 }}>
          Preview Word documents stored in Storgbay. Choose a document from your library or a shared gallery to
          start viewing.
        </p>
      </header>

      {status && (
        <div
          role="status"
          style={{
            padding: "12px 16px",
            borderRadius: 8,
            border: `1px solid ${toneStyles[status.tone].border}`,
            background: toneStyles[status.tone].background,
            color: toneStyles[status.tone].color,
            fontSize: 15,
          }}
        >
          {status.text}
        </div>
      )}

      {currentDocument ? (
        <section style={{ display: "grid", gap: 16 }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              justifyContent: "space-between",
              alignItems: "baseline",
            }}
          >
            <div style={{ display: "grid", gap: 4 }}>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>{currentDocument.filename}</h2>
              {viewer && (
                <span style={{ fontSize: 13, color: "#6b7280" }}>
                  Viewing via
                  {" "}
                  {viewer.provider === "microsoft"
                    ? "Microsoft Office"
                    : viewer.provider === "google"
                      ? "Google Docs viewer"
                      : "your browser"}
                </span>
              )}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <a
                href={currentDocument.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: "8px 14px",
                  borderRadius: 6,
                  border: "1px solid #1a73e8",
                  background: "#1a73e8",
                  color: "white",
                  fontWeight: 500,
                  textDecoration: "none",
                }}
              >
                Open original
              </a>
              <a
                href={currentDocument.url}
                download={currentDocument.filename}
                style={{
                  padding: "8px 14px",
                  borderRadius: 6,
                  border: "1px solid #1a73e8",
                  color: "#1a73e8",
                  fontWeight: 500,
                  textDecoration: "none",
                }}
              >
                Download copy
              </a>
            </div>
          </div>

          {viewer ? (
            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                overflow: "hidden",
                background: "#f9fafb",
              }}
            >
              <iframe
                key={viewer.url}
                src={viewer.url}
                title={`Preview of ${currentDocument.filename}`}
                style={{ width: "100%", minHeight: "70vh", border: 0 }}
                allowFullScreen
              />
            </div>
          ) : (
            <div
              style={{
                padding: 24,
                borderRadius: 12,
                border: "1px dashed #d1d5db",
                background: "#f9fafb",
                color: "#6b7280",
                fontSize: 15,
              }}
            >
              We couldn&apos;t generate a preview for this document. Use the buttons above to open or download the original
              file.
            </div>
          )}

          <p style={{ margin: 0, color: "#6b7280", fontSize: 14 }}>
            If the embedded preview does not load, open the original document in a new tab. Some private documents may
            require signing in again with the external viewer.
          </p>
        </section>
      ) : (
        <section
          style={{
            padding: 32,
            borderRadius: 12,
            border: "1px dashed #d1d5db",
            background: "#f9fafb",
            textAlign: "center",
            color: "#4b5563",
            display: "grid",
            gap: 12,
          }}
        >
          <span role="img" aria-hidden={true} style={{ fontSize: 40 }}>
            📄
          </span>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Select a document to preview</h2>
          <p style={{ margin: 0, fontSize: 15 }}>
            Pick a <strong>.docx</strong> file or a Google Docs link from your storage. You can choose files from the{" "}
            <Link href="/dashboard" style={{ color: "#1a73e8" }}>
              dashboard
            </Link>{" "}
            or from any shared gallery that includes Word documents.
          </p>
        </section>
      )}
    </div>
  );
}
