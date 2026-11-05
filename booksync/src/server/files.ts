import "server-only";
import sharp from "sharp";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { file } from "@/db/schema";
import { UserError } from "@/server/errors";

export type FileKind = "logo" | "cover" | "staff_photo" | "service_image";

const MAX_INPUT_BYTES = 5 * 1024 * 1024;
const ACCEPTED = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
  "image/gif",
  "image/avif",
]);
const SIZES: Record<FileKind, { width: number; height: number; fit: "inside" | "cover" }> = {
  logo: { width: 512, height: 512, fit: "inside" },
  staff_photo: { width: 400, height: 400, fit: "cover" },
  service_image: { width: 1200, height: 800, fit: "cover" },
  cover: { width: 1800, height: 700, fit: "cover" },
};

/**
 * Enregistre une image : vérification du type et de la taille, puis ré-encodage en WebP.
 * Le ré-encodage neutralise tout contenu actif (SVG avec script, métadonnées EXIF/GPS).
 */
export async function storeImage(organizationId: string, kind: FileKind, upload: File) {
  if (!(upload instanceof File) || upload.size === 0) throw new UserError("Aucun fichier reçu.");
  if (upload.size > MAX_INPUT_BYTES) throw new UserError("L'image ne doit pas dépasser 5 Mo.");
  if (!ACCEPTED.has(upload.type))
    throw new UserError("Format non pris en charge. Utilisez PNG, JPG, WEBP ou SVG.");

  const input = Buffer.from(await upload.arrayBuffer());
  let output: { data: Buffer; info: { size: number; width: number; height: number } };
  try {
    const size = SIZES[kind];
    output = await sharp(input, { limitInputPixels: 40_000_000, density: 300 })
      .rotate()
      .resize({ width: size.width, height: size.height, fit: size.fit, withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer({ resolveWithObject: true });
  } catch {
    throw new UserError("Ce fichier n'est pas une image valide.");
  }
  const [row] = await db
    .insert(file)
    .values({
      organizationId,
      kind,
      contentType: "image/webp",
      byteSize: output.info.size,
      width: output.info.width,
      height: output.info.height,
      data: output.data,
    })
    .returning({ id: file.id });
  return row.id;
}

export async function deleteFile(organizationId: string, id: string | null | undefined) {
  if (!id) return;
  await db.delete(file).where(and(eq(file.id, id), eq(file.organizationId, organizationId)));
}
