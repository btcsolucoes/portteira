/** Provider-neutral port for a future authenticated backend; no upload implementation exists in this shell. */
export interface MediaStorage {
  createUpload(
    request: {
      ownerId: string;
      filename: string;
      contentType: string;
      byteLength: number;
    },
    context?: { signal?: AbortSignal },
  ): Promise<{
    mediaId: string;
    uploadUrl: string;
    expiresAt: string;
    requiredHeaders: Readonly<Record<string, string>>;
  }>;
  getReadUrl(
    mediaId: string,
    context?: { signal?: AbortSignal },
  ): Promise<{ url: string; expiresAt: string }>;
  delete(mediaId: string, context?: { signal?: AbortSignal }): Promise<void>;
}

export type MediaProcessingState =
  'awaiting-upload' | 'quarantined' | 'processing' | 'ready' | 'rejected';
