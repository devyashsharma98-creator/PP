"use client";

import { useMutation } from "@tanstack/react-query";

interface PresignedUploadResponse {
  url: string;
  fields: Record<string, string>;
  key: string;
}

async function getPresignedUrl(
  filename: string,
  contentType: string,
  bucket?: string
): Promise<PresignedUploadResponse> {
  const res = await fetch("/api/v1/upload/presigned", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename, contentType, bucket }),
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.error?.message || "Failed to get presigned URL.");
  }

  return data.data as PresignedUploadResponse;
}

async function uploadToPresignedUrl(
  file: File,
  presigned: PresignedUploadResponse
): Promise<string> {
  const formData = new FormData();

  Object.entries(presigned.fields).forEach(([k, v]) => {
    formData.append(k, v);
  });

  formData.append("file", file);

  const res = await fetch(presigned.url, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error("File upload to storage failed.");
  }

  // Return the public URL derived from the key
  return `${presigned.url}/${presigned.key}`;
}

export function usePresignedUpload() {
  return useMutation({
    mutationFn: async ({
      file,
      options,
    }: {
      file: File;
      options?: { bucket?: string };
    }) => {
      const presigned = await getPresignedUrl(
        file.name,
        file.type,
        options?.bucket
      );
      const publicUrl = await uploadToPresignedUrl(file, presigned);
      return publicUrl;
    },
  });
}

export async function uploadFile(
  file: File,
  options?: { bucket?: string }
): Promise<string> {
  const presigned = await getPresignedUrl(file.name, file.type, options?.bucket);
  return uploadToPresignedUrl(file, presigned);
}
