"use client";

import React from "react";

interface AdminDataStateProps {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** Shared state surface for Firestore-backed admin pages. */
export function AdminDataState({
  title,
  message,
  actionLabel,
  onAction,
}: AdminDataStateProps) {
  return (
    <div
      role="status"
      style={{
        padding: "32px 24px",
        textAlign: "center",
        border: "1px solid var(--adm-border)",
        borderRadius: "12px",
        backgroundColor: "#FFFFFF",
      }}
    >
      <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#121110", marginBottom: "8px" }}>
        {title}
      </h3>
      <p style={{ fontSize: "13px", color: "var(--adm-text-muted)", lineHeight: 1.5 }}>
        {message}
      </p>
      {actionLabel && onAction && (
        <button type="button" onClick={onAction} className="admin-btn-secondary" style={{ marginTop: "16px" }}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function adminErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "The Firestore data service could not be reached. Check the server configuration and try again.";
}
