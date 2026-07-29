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

export function usesNativeDocumentPicker() {
  return Capacitor.isNativePlatform();
}

export async function pickNativeDocuments(multiple = true): Promise<File[]> {
  const result = await FilePicker.pickFiles({
    limit: multiple ? 0 : 1,
    readData: true,
  });

  return result.files.map((pickedFile) => {
    if (!pickedFile.data) {
      throw new Error(`${pickedFile.name}: the phone did not return readable file data.`);
    }

    const base64 = pickedFile.data.includes(",")
      ? pickedFile.data.slice(pickedFile.data.indexOf(",") + 1)
      : pickedFile.data;
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }

    return new File([bytes], pickedFile.name, {
      type: pickedFile.mimeType || MIME_BY_EXTENSION[extensionOf(pickedFile.name)] || "application/octet-stream",
      lastModified: pickedFile.modifiedAt || Date.now(),
    });
  });
}
import { Capacitor } from "@capacitor/core";
import { FilePicker } from "@capawesome/capacitor-file-picker";
