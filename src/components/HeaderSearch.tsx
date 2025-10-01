"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function HeaderSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState("");

  useEffect(() => {
    const nextValue = searchParams?.get("query") ?? "";
    setValue(nextValue);
  }, [searchParams]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = value.trim();
    const params = new URLSearchParams();
    if (trimmed) {
      params.set("query", trimmed);
    }
    const target = params.size > 0 ? `/files?${params.toString()}` : "/files";
    router.push(target);
  }

  return (
    <form className="drive-search" role="search" onSubmit={handleSubmit}>
      <span className="drive-search-icon" aria-hidden>
        🔍
      </span>
      <input
        id="drive-search"
        className="drive-search-input"
        type="search"
        name="query"
        placeholder="Search files, folders, galleries..."
        autoComplete="off"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        aria-label="Search"
      />
    </form>
  );
}
