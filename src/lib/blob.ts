import { put } from "@vercel/blob";

/**
 * Save an uploaded image to Vercel Blob
 * Returns the blob URL or null if saving failed
 */
export async function saveUploadedImage(
  imageBase64: string,
  folder: "uploads" | "failed-uploads" = "uploads"
): Promise<string | null> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.log("Blob storage not configured, skipping image save");
    return null;
  }

  try {
    const match = imageBase64.match(/^data:(image\/[a-zA-Z0-9+-]+)(?:;[^;,]+)*;base64,(.+)$/);
    if (!match) {
      console.error("Could not parse image data URL for blob storage");
      return null;
    }

    const mediaType = match[1];
    const base64Data = match[2];
    const buffer = Buffer.from(base64Data, "base64");

    const extMap: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/jpg": "jpg",
      "image/png": "png",
      "image/gif": "gif",
      "image/webp": "webp",
    };
    const ext = extMap[mediaType] || "jpg";

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `${folder}/${timestamp}.${ext}`;

    const blob = await put(filename, buffer, {
      access: "public",
      contentType: mediaType,
      addRandomSuffix: true,
    });

    console.log(`Saved image to blob: ${blob.url}`);
    return blob.url;
  } catch (err) {
    console.error("Failed to save image to blob storage:", err);
    return null;
  }
}

/**
 * Save a failed image upload to Vercel Blob for diagnosis
 * Returns the blob URL or null if saving failed
 */
export async function saveFailedImage(
  imageBase64: string,
  error: string
): Promise<string | null> {
  // Only save if BLOB_READ_WRITE_TOKEN is configured
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.log("Blob storage not configured, skipping image save");
    return null;
  }

  try {
    // Extract media type and base64 data from data URL
    const match = imageBase64.match(/^data:(image\/[a-zA-Z0-9+-]+)(?:;[^;,]+)*;base64,(.+)$/);
    if (!match) {
      console.error("Could not parse image data URL for blob storage");
      return null;
    }

    const mediaType = match[1];
    const base64Data = match[2];

    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, "base64");

    // Determine file extension
    const extMap: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/jpg": "jpg",
      "image/png": "png",
      "image/gif": "gif",
      "image/webp": "webp",
    };
    const ext = extMap[mediaType] || "jpg";

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `failed-uploads/${timestamp}.${ext}`;

    // Upload to Vercel Blob
    const blob = await put(filename, buffer, {
      access: "public",
      contentType: mediaType,
      addRandomSuffix: true,
    });

    console.log(`Saved failed image to blob: ${blob.url}`);
    return blob.url;
  } catch (err) {
    console.error("Failed to save image to blob storage:", err);
    return null;
  }
}
