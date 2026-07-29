const DOCUMENT_MIME_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
]);

const MIME_BY_EXTENSION: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
};

function extensionOf(fileName: string) {
  return fileName.toLowerCase().split(".").pop() || "";
}

export function isSupportedDocument(file: File) {
  return DOCUMENT_MIME_TYPES.has(file.type.toLowerCase()) || extensionOf(file.name) in MIME_BY_EXTENSION;
}

export function documentContentType(file: File) {
  const normalizedType = file.type.toLowerCase();
  if (DOCUMENT_MIME_TYPES.has(normalizedType)) return normalizedType;
  return MIME_BY_EXTENSION[extensionOf(file.name)] || "application/octet-stream";
}
