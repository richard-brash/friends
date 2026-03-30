export const VERSION = import.meta.env.VITE_APP_VERSION || "0.0.0";
export const GIT_COMMIT = import.meta.env.VITE_GIT_COMMIT || "unknown";

export function getVersionString(): string {
  return `${VERSION}+${GIT_COMMIT.slice(0, 7)}`;
}
