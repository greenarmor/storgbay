"use client";

import { FormEvent } from "react";

export function CreateGalleryForm() {
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const title = (formData.get("title") as string | null) ?? "New Gallery";
    const visibility = (formData.get("visibility") as string | null) ?? "PUBLIC";

    await fetch("/api/galleries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, visibility, fileIds: [] }),
    });

    form.reset();
    window.location.reload();
  }

  return (
    <form className="create-gallery-form" onSubmit={handleSubmit}>
      <input name="title" placeholder="Folder name" aria-label="Golder name" />
      <select name="visibility" defaultValue="PUBLIC" aria-label="Visibility">
        <option value="PUBLIC">Public</option>
        <option value="PRIVATE">Private</option>
      </select>
      <button type="submit">+ Create</button>
    </form>
  );
}
