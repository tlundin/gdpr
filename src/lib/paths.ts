import path from "path";

export function uploadsRoot() {
  return path.join(process.cwd(), "uploads");
}

export function tenantUploadDir(tenantId: string) {
  return path.join(uploadsRoot(), tenantId);
}
