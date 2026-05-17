// Client-side image resize + re-encode utility.
// Used by admin upload UIs to keep uploaded files small (storage +
// bandwidth) and uniform (so they crop nicely in catalog cards).
//
// Behaviour:
//   1. Load the user's file into an in-memory Image.
//   2. If larger than MAX_DIM on either axis, scale down proportionally
//      so the longest edge becomes MAX_DIM. (Never upscales.)
//   3. Draw to a canvas at the new dimensions.
//   4. Export as image/webp at QUALITY.
//   5. Return a Blob whose name preserves the original base + .webp.
//
// Browsers that don't support canvas.toBlob with WebP get a JPEG fallback.

export const MAX_DIM = 1200;
export const QUALITY = 0.82;

export interface ResizedImage {
  blob: Blob;
  filename: string;
  width: number;
  height: number;
  bytes: number;
}

export async function resizeImageForUpload(file: File): Promise<ResizedImage> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Selected file is not an image.");
  }
  const dataUrl = await readAsDataURL(file);
  const img = await loadImage(dataUrl);

  const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
  const targetW = Math.round(img.width * scale);
  const targetH = Math.round(img.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable.");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, targetW, targetH);

  const supportsWebp = canvasSupportsType(canvas, "image/webp");
  const mime = supportsWebp ? "image/webp" : "image/jpeg";
  const ext = supportsWebp ? "webp" : "jpg";

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Canvas export failed."))),
      mime,
      QUALITY,
    );
  });

  const baseName = file.name.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9-]+/g, "-").slice(0, 60) || "image";
  return {
    blob,
    filename: `${baseName}-${Date.now()}.${ext}`,
    width: targetW,
    height: targetH,
    bytes: blob.size,
  };
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error ?? new Error("read failed"));
    r.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("Image load failed."));
    i.src = src;
  });
}

function canvasSupportsType(canvas: HTMLCanvasElement, type: string): boolean {
  try {
    return canvas.toDataURL(type).startsWith(`data:${type}`);
  } catch {
    return false;
  }
}
