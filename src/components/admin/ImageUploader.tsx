"use client";

import { useRef, useState } from "react";
import { Image as ImageIcon, Loader2, Upload } from "lucide-react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { resizeImageForUpload } from "@/lib/image/resize";

interface Props {
  value: string;
  onChange: (url: string) => void;
  bucket?: string;
  folder?: string;
}

// Admin-only image picker. On file select, resizes client-side to max
// 1200x1200 WebP (~200 KB) and uploads to Supabase Storage. The
// returned public URL is written back via onChange. The text input is
// still editable so admins can paste an external URL (e.g. Unsplash)
// or clear the value.
export default function ImageUploader({ value, onChange, bucket = "product-images", folder = "" }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      if (!isSupabaseConfigured()) {
        throw new Error("Configure Supabase to upload images.");
      }
      const resized = await resizeImageForUpload(file);
      const sb = getSupabaseBrowserClient();
      const path = `${folder ? folder.replace(/\/$/, "") + "/" : ""}${resized.filename}`;
      const { error: upErr } = await sb.storage.from(bucket).upload(path, resized.blob, {
        contentType: resized.blob.type,
        cacheControl: "31536000, immutable",
        upsert: false,
      });
      if (upErr) throw upErr;
      const { data } = sb.storage.from(bucket).getPublicUrl(path);
      onChange(data.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://... or upload"
          className="adm-input flex-1"
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-1 rounded-md border border-neutral-300 bg-white px-3 text-xs font-medium hover:bg-neutral-50 disabled:opacity-50"
        >
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </div>
      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      {error && <p className="text-xs text-red-600">{error}</p>}
      {value && (
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <ImageIcon className="h-3.5 w-3.5" />
          <span className="truncate">{value}</span>
        </div>
      )}
      <p className="text-[11px] text-neutral-400">
        Uploaded images are resized to 1200&nbsp;px max and compressed (WebP). Hard cap 512&nbsp;KB.
      </p>
    </div>
  );
}
