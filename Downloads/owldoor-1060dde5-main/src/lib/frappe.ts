export const DEFAULT_FRAPPE_URL = "https://frappe.io/?embed=1";

export function getFrappeUrl() {
  const envUrl = import.meta.env.VITE_FRAPPE_URL;
  if (envUrl && envUrl.trim().length > 0) {
    return envUrl;
  }
  return DEFAULT_FRAPPE_URL;
}

