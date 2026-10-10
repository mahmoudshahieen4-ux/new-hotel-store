import { put, del } from "@vercel/blob";

export const uploadImage = async (image: File) => {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error("Missing BLOB_READ_WRITE_TOKEN environment variable.");
  }

  const timestamp = Date.now();
  const sanitizedName = (image.name || "image")
    .replace(/[^a-zA-Z0-9.-]/g, "_")
    .toLowerCase();
  const newName = `${timestamp}-${sanitizedName}`;

  const blob = await put(newName, image, {
    access: "public",
    token,
  });

  if (!blob.url) throw new Error("Image upload failed");
  return blob.url;
};

export const deleteImage = async (url: string) => {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error("Missing BLOB_READ_WRITE_TOKEN environment variable.");
  }
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const blobPath = pathname.startsWith("/") ? pathname.slice(1) : pathname;

    await del(blobPath, {
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
  } catch (error) {
    console.error("Error deleting image:", error);
  }
};
