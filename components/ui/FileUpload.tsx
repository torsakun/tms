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
      <label className="relative flex flex-col items-center justify-center w-full h-24 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          {isUploading ? (
            <Loader2 size={24} className="text-blue-500 animate-spin mb-2" />
          ) : (
            <UploadCloud size={24} className="text-slate-400 mb-2" />
          )}
          <p className="text-xs text-slate-500">
            {isUploading ? "Uploading..." : <><span className="font-semibold">Click to upload</span> or drag and drop</>}
          </p>
        </div>
        <input 
          type="file" 
          className="hidden" 
          onChange={handleFileChange} 
          disabled={isUploading}
        />
      </label>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
