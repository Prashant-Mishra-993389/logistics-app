const trim = (value) => value.trim();

const withFallbackUrl = (candidate, fallback) => {
  const raw = typeof candidate === "string" ? trim(candidate) : "";
  if (!raw) {
    return fallback;
  }

  if (/^https?:\/\//i.test(raw)) {
    return raw.replace(/\/+$/, "");
  }

  return `http://${raw.replace(/\/+$/, "")}`;
};

const normalizeApiBase = (candidate) => {
  const raw = typeof candidate === "string" ? trim(candidate) : "";
  if (!raw) {
    return "/api";
  }

  if (raw.startsWith("/")) {
    return raw.replace(/\/+$/, "") || "/api";
  }

  return withFallbackUrl(raw, "/api");
};

const portalUrls = {
  client: withFallbackUrl(import.meta.env.VITE_COMPANY_DASHBOARD_URL, "http://localhost:5174"),
  admin: withFallbackUrl(import.meta.env.VITE_ADMIN_DASHBOARD_URL, "http://localhost:5175"),
  driver: withFallbackUrl(import.meta.env.VITE_DRIVER_DASHBOARD_URL, "http://localhost:5176"),
};

const rolePortalMap = {
  client: {
    label: "Client Dashboard",
    description: "Book loads, track routes, and manage shipments.",
    url: portalUrls.client,
  },
  admin: {
    label: "Admin Dashboard",
    description: "Manage users, disputes, analytics, and global settings.",
    url: portalUrls.admin,
  },
  driver: {
    label: "Driver Dashboard",
    description: "Accept loads, manage POD workflow, and update live telemetry.",
    url: portalUrls.driver,
  },
};

const apiBase = normalizeApiBase(import.meta.env.VITE_API_BASE_URL);

const buildApiUrl = (path) => {
  const safePath = typeof path === "string" ? path : "";
  if (!safePath) {
    return apiBase;
  }

  if (safePath.startsWith("http://") || safePath.startsWith("https://")) {
    return safePath;
  }

  return `${apiBase}${safePath.startsWith("/") ? "" : "/"}${safePath}`;
};

const openInNewTab = (url) => {
  if (typeof window === "undefined") {
    return;
  }

  window.open(url, "_blank", "noopener,noreferrer");
};

export { apiBase, buildApiUrl, openInNewTab, portalUrls, rolePortalMap };
