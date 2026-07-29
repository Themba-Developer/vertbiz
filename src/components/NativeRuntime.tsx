import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { Keyboard, KeyboardResize } from "@capacitor/keyboard";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";
import { supabase } from "@/integrations/supabase/client";

const openNativeUrl = async (url: string) => {
  const parsed = new URL(url);
  const hash = new URLSearchParams(parsed.hash.replace(/^#/, ""));
  const accessToken = hash.get("access_token");
  const refreshToken = hash.get("refresh_token");

  if (accessToken && refreshToken) {
    await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  }

  const mode = parsed.searchParams.get("mode") || (hash.get("type") === "recovery" ? "reset" : null);
  const route = parsed.hostname === "auth" ? "/auth" : parsed.pathname || "/";
  const destination = mode ? `${route}?mode=${encodeURIComponent(mode)}` : route;
  window.history.replaceState({}, "", destination);
  window.dispatchEvent(new PopStateEvent("popstate"));
};

export function NativeRuntime() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    void StatusBar.setOverlaysWebView({ overlay: false });
    void StatusBar.setStyle({ style: Style.Dark });
    if (Capacitor.getPlatform() === "android") {
      void StatusBar.setBackgroundColor({ color: "#ffffff" });
    }
    void Keyboard.setResizeMode({ mode: KeyboardResize.Native });
    void SplashScreen.hide();

    const listeners = [
      App.addListener("appUrlOpen", ({ url }) => void openNativeUrl(url)),
      App.addListener("backButton", ({ canGoBack }) => {
        if (canGoBack) window.history.back();
        else void App.exitApp();
      }),
    ];

    void App.getLaunchUrl().then((result) => {
      if (result?.url) void openNativeUrl(result.url);
    });

    return () => {
      void Promise.all(listeners).then((handles) => handles.forEach((handle) => void handle.remove()));
    };
  }, []);

  return null;
}
