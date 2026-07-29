// Guarded service worker registration for production browser contexts.

const baseUrl = import.meta.env.BASE_URL || "/";
const SW_SCOPE = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
const SW_URL = `${SW_SCOPE}sw.js`;

function shouldSkipRegistration(): boolean {
  if (typeof window === "undefined") return true;
  if (!("serviceWorker" in navigator)) return true;
  if (!import.meta.env.PROD) return true;
  try {
    if (window.self !== window.top) return true;
  } catch {
    return true;
  }
  if (new URL(window.location.href).searchParams.get("sw") === "off") return true;
  return false;
}

async function unregisterMatching() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  const regs = await navigator.serviceWorker.getRegistrations();
  for (const r of regs) {
    const url = r.active?.scriptURL || r.installing?.scriptURL || r.waiting?.scriptURL || "";
    if (url.endsWith("/sw.js") || url.endsWith(SW_URL)) {
      try { await r.unregister(); } catch { /* ignore */ }
    }
  }
}

export function registerServiceWorker() {
  if (shouldSkipRegistration()) {
    void unregisterMatching();
    return;
  }
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(SW_URL, { scope: SW_SCOPE }).catch((err) => {
      console.warn("[sw] registration failed", err);
    });
  });
}
