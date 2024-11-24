export const s3StorageUrl = "https://storage.infinityserver.ru";
export const frontendUrl = "https://infinityserver.ru";

export function getUserSkinAvatarUrl(skinHash?: string): string {
  if (!skinHash) return `${s3StorageUrl}/textures/avatars/null`;
  return `${s3StorageUrl}/textures/avatars/${skinHash}`;
}

export function getPersonalAccountPageUrl(): string {
  return `${frontendUrl}/pa`;
}

export function getRegisterPageUrl(): string {
  return `${frontendUrl}/register`;
}
