"use client";

import React, { useState } from "react";
import { UploadCloud, X, File as FileIcon, Loader2 } from "lucide-react";

interface FileUploadProps {
  projectId: string;
  onUploadComplete: (attachment: any) => void;
}

export function FileUpload({ projectId, onUploadComplete }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("projectId", projectId);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      onUploadComplete(data);
    } catch (err: any) {
      setError(err.message || "Failed to upload file");
    } finally {
      setIsUploading(false);
      // Reset input
      e.target.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="relative flex flex-col items-center justify-center w-full h-24 border-2 border-text-muted border-dashed rounded-lg cursor-pointer bg-surface-hover hover:bg-surface-hover transition-colors">
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          {isUploading ? (
            <Loader2 size={24} className="text-primary animate-spin mb-2" />
          ) : (
            <UploadCloud size={24} className="text-text-muted mb-2" />
          )}
          <p className="text-xs text-text-muted">
            {isUploading ? (
              "Uploading..."
            ) : (
              <>
                <span className="font-semibold">Click to upload</span> or drag
                and drop
              </>
            )}
          </p>
        </div>
        <input
          type="file"
          className="hidden"
          onChange={handleFileChange}
          disabled={isUploading}
        />
      </label>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
