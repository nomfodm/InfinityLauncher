import { GetVersion } from "../wailsjs/go/main/App";

export function capitalizeWord(word: string): string {
  if (!word) return "";
  return word[0].toUpperCase() + word.substring(1);
}

export function formatVersion(version: string): string {
  if (version.endsWith("-m")) {
    return version.slice(0, version.length - 2);
  }

  return version;
}

export async function GetFormattedVersion(): Promise<string> {
  return formatVersion(await GetVersion());
}
