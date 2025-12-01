export const s3StorageUrl = "https://storage.infinityserver.ru";
export const frontendUrl = "https://infinityserver.ru";

export function getUserSkinAvatarUrl(skinHash?: string): string {
  if (!skinHash) return `${s3StorageUrl}/textures/avatars/null`;
  return `${s3StorageUrl}/textures/avatars/${skinHash}`;
}

export function getUserSkinUrl(skinHash?: string): string {
  if (!skinHash) return `${s3StorageUrl}/textures/null`;
  return `${s3StorageUrl}/textures/${skinHash}`;
}

export function getUserCapeUrl(capeHash?: string): string {
  if (!capeHash) return ``;
  return `${s3StorageUrl}/textures/${capeHash}`;
}

export function getPersonalAccountPageUrl(): string {
  return `${frontendUrl}/pa`;
}

export function getRegisterPageUrl(): string {
  return `${frontendUrl}/register`;
}

export function getLauncherDownloadUrl(): string {
  return `${frontendUrl}/launcher`;
}
