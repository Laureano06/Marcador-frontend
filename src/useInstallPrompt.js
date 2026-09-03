import { useCallback, useEffect, useState } from "react";

// El botón "Instalar app" solo puede existir de verdad en navegadores que
// disparan beforeinstallprompt (Chrome/Edge/Android) — Safari/iOS no lo
// soporta y ya cubrimos ese caso con las meta apple-mobile-web-app-*. No
// hay forma honesta de mostrar el botón en iOS: mostrarlo ahí y que no
// haga nada sería peor que no mostrarlo.
export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const onInstalled = () => {
      setDeferredPrompt(null);
      setInstalled(true);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  return {
    canInstall: !!deferredPrompt && !installed,
    promptInstall,
  };
}
