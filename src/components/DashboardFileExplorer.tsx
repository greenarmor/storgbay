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
    <section className="dashboard-section">
      <div className="dashboard-section__header">
        <div>
          <h2 className="dashboard-section__title">My files explorer</h2>
          <p className="dashboard-section__description">
            Manage uploads, build new folders, and keep your workspace organised from a single view.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="drive-button-muted dashboard-section__cta"
        >
          Open in popup
        </button>
      </div>

      <div className="drive-panel dashboard-file-panel">
        <div className="dashboard-file-panel__body">
          <FileManager initialSearch={initialSearch} />
        </div>
      </div>

      <GalleryManagerModal open={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </section>
  );
}
