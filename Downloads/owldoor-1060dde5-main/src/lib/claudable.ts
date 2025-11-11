export const DEFAULT_CLAUDABLE_URL = "https://claudable.app/?embed=1";

export function getClaudableUrl() {
  // Check localStorage first (for UI-configured URLs)
  const storedUrl = localStorage.getItem("claudable_url");
  if (storedUrl && storedUrl.trim().length > 0) {
    return storedUrl.includes("?embed=1") ? storedUrl : `${storedUrl}?embed=1`;
  }
  
  // Then check environment variable
  const envUrl = import.meta.env.VITE_CLAUDABLE_URL;
  if (envUrl && envUrl.trim().length > 0) {
    return envUrl.includes("?embed=1") ? envUrl : `${envUrl}?embed=1`;
  }
  
  return DEFAULT_CLAUDABLE_URL;
}

export function setClaudableUrl(url: string) {
  const urlWithEmbed = url.includes("?embed=1") ? url : `${url}?embed=1`;
  localStorage.setItem("claudable_url", urlWithEmbed);
}

