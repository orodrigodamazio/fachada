import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID ?? "";
const ACCESS_KEY = process.env.R2_ACCESS_KEY_ID ?? "";
const SECRET = process.env.R2_SECRET_ACCESS_KEY ?? "";
const BUCKET = process.env.R2_BUCKET ?? "";
const PUBLIC_BASE = (process.env.R2_PUBLIC_BASE_URL ?? "").replace(/\/$/, "");

export class R2Error extends Error {
  constructor(message: string, public code: "NO_CONFIG" | "INVALID_TYPE" | "TOO_LARGE" | "API_ERROR") {
    super(message);
    this.name = "R2Error";
  }
}

let client: S3Client | null = null;
function getClient(): S3Client {
  if (client) return client;
  if (!ACCOUNT_ID || !ACCESS_KEY || !SECRET || !BUCKET || !PUBLIC_BASE) {
    throw new R2Error(
      "R2 não configurado. Defina R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_BASE_URL no .env",
      "NO_CONFIG",
    );
  }
  client = new S3Client({
    region: "auto",
    endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET },
  });
  return client;
}

const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/svg+xml"]);

export async function uploadImagem(opts: {
  buffer: Buffer;
  contentType: string;
  slug: string;
  tipo: "logo" | "hero";
}): Promise<string> {
  if (opts.buffer.byteLength > MAX_BYTES) {
    throw new R2Error("Imagem maior que 4 MB", "TOO_LARGE");
  }
  if (!ALLOWED.has(opts.contentType)) {
    throw new R2Error(`Tipo não permitido: ${opts.contentType}`, "INVALID_TYPE");
  }

  const ext = opts.contentType === "image/svg+xml" ? "svg" : opts.contentType.split("/")[1];
  const key = `sites/${opts.slug}/${opts.tipo}-${Date.now()}.${ext}`;

  try {
    await getClient().send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: opts.buffer,
        ContentType: opts.contentType,
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
  } catch (e) {
    if (e instanceof R2Error) throw e;
    throw new R2Error(`Upload falhou: ${(e as Error).message}`, "API_ERROR");
  }

  return `${PUBLIC_BASE}/${key}`;
}

export async function deletarImagem(url: string): Promise<void> {
  if (!url.startsWith(PUBLIC_BASE)) return;
  const key = url.slice(PUBLIC_BASE.length + 1);
  try {
    await getClient().send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
  } catch {
    // best-effort
  }
}
