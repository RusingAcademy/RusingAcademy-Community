import { Router } from "express";
import { storagePut } from "../storage";
import { nanoid } from "nanoid";

const uploadRouter = Router();

// POST /api/upload/image — accepts base64 image data
uploadRouter.post("/image", async (req, res) => {
  try {
    const { data, contentType, filename } = req.body;

    if (!data || !contentType) {
      return res.status(400).json({ error: "Missing data or contentType" });
    }

    // Validate content type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(contentType)) {
      return res.status(400).json({ error: "Invalid content type. Allowed: jpeg, png, gif, webp" });
    }

    // Decode base64
    const buffer = Buffer.from(data, "base64");

    // Max 5MB
    if (buffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({ error: "File too large. Maximum 5MB." });
    }

    const ext = contentType.split("/")[1] === "jpeg" ? "jpg" : contentType.split("/")[1];
    const key = `community/uploads/${nanoid()}.${ext}`;

    const { url } = await storagePut(key, buffer, contentType);

    return res.json({ url, key });
  } catch (error) {
    console.error("[Upload] Error:", error);
    return res.status(500).json({ error: "Upload failed" });
  }
});

export { uploadRouter };
