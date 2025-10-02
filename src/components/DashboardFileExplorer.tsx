"use client";

import { useState } from "react";
import { FileManager } from "@/components/FileManager";
import { GalleryManagerModal } from "@/components/GalleryManagerModal";

type DashboardFileExplorerProps = {
  initialSearch?: string;
};

export function DashboardFileExplorer({ initialSearch = "" }: DashboardFileExplorerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <section style={{ display: "grid", gap: 16 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
          alignItems: "flex-start",
        }}
      >
        <div>
          <h2 style={{ marginBottom: 4 }}>My files explorer</h2>
          <p style={{ margin: 0, color: "var(--drive-muted)" }}>
            Manage uploads, build new folders, and keep your workspace organised from a single view.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="drive-button-muted"
          style={{ whiteSpace: "nowrap" }}
        >
          Open in popup
        </button>
      </div>

      <div className="drive-panel" style={{ padding: 0 }}>
        <div style={{ padding: 20 }}>
          <FileManager initialSearch={initialSearch} />
        </div>
      </div>

      <GalleryManagerModal open={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </section>
  );
}
