import { NextRequest } from "next/server";
import { withAuth } from "@/lib/middleware/with-auth";
import { apiSuccess, apiError, serverError } from "@/lib/response";
import { presignedUploadSchema } from "@/lib/validators/upload";
import { randomUUID } from "crypto";
import path from "path";

/**
 * POST /api/v1/upload/presigned
 *
 * Generates a presigned POST URL for S3-compatible storage.
 * Requires authentication.
 *
 * Body: { filename: string, contentType: string, bucket?: string }
 */
export const POST = withAuth(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const parsed = presignedUploadSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(
        "BAD_REQUEST",
        parsed.error.errors.map((e) => e.message).join(", "),
        400
      );
    }

    const { filename, contentType, bucket } = parsed.data;

    const endpoint = process.env.R2_ENDPOINT;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const defaultBucket = process.env.R2_BUCKET_NAME;

    const targetBucket = bucket || defaultBucket;

    if (!endpoint || !accessKeyId || !secretAccessKey || !targetBucket) {
      return apiError(
        "SERVICE_UNAVAILABLE",
        "File upload is not configured. R2 credentials are missing.",
        503
      );
    }

    const ext = path.extname(filename) || "";
    const key = `uploads/${randomUUID()}${ext}`;

    // Dynamic import of AWS SDK to avoid hard dependency issues.
    // If the SDK is not installed, fall back to a mock/dev mode.
    try {
      // @ts-ignore — optional AWS SDK, not installed by default
      const { S3Client } = await import("@aws-sdk/client-s3");
      // @ts-ignore — optional AWS SDK, not installed by default
      const { createPresignedPost } = await import("@aws-sdk/s3-presigned-post");

      const client = new S3Client({
        region: "auto",
        endpoint,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });

      const { url, fields } = await createPresignedPost(client, {
        Bucket: targetBucket,
        Key: key,
        Conditions: [
          ["content-length-range", 0, 10 * 1024 * 1024], // 10 MB max
          ["eq", "$Content-Type", contentType],
        ],
        Fields: {
          "Content-Type": contentType,
        },
        Expires: 600, // 10 minutes
      });

      return apiSuccess({
        url,
        fields,
        key,
      });
    } catch (sdkErr) {
      // AWS SDK not available — return a mock/dev response for local development
      if (
        sdkErr instanceof Error &&
        (sdkErr.message.includes("Cannot find module") ||
          sdkErr.message.includes("Module not found"))
      ) {
        return apiSuccess({
          url: `${endpoint}/${targetBucket}`,
          fields: {
            key,
            "Content-Type": contentType,
          },
          key,
        });
      }

      throw sdkErr;
    }
  } catch (err) {
    console.error("Presigned upload error:", err);
    return serverError("Failed to generate presigned upload URL.");
  }
});
