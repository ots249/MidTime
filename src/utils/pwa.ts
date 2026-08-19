// PWA Service Worker Registration & Installation Prompt Manager

let deferredInstallPrompt: any = null;
const installListeners: Array<(canInstall: boolean) => void> = [];

export function registerPwaServiceWorker() {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          // Service worker registered successfully
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === "installed") {
                  if (navigator.serviceWorker.controller) {
                    console.log("MidTime: নতুন সংস্করণ পাওয়া গেছে, রিফ্রেশ করুন।");
                  }
                }
              };
            }
          };
        })
        .catch((error) => {
          console.warn("MidTime SW registration failed:", error);
        });
    });

    // Capture beforeinstallprompt for in-app install button
    window.addEventListener("beforeinstallprompt", (e: Event) => {
      e.preventDefault();
      deferredInstallPrompt = e;
      notifyInstallListeners(true);
    });

    window.addEventListener("appinstalled", () => {
      deferredInstallPrompt = null;
      notifyInstallListeners(false);
      console.log("MidTime app was successfully installed!");
    });
  }
}

export function subscribeToInstallPrompt(callback: (canInstall: boolean) => void) {
  installListeners.push(callback);
  callback(!!deferredInstallPrompt);

  return () => {
    const idx = installListeners.indexOf(callback);
    if (idx !== -1) installListeners.splice(idx, 1);
  };
}

function notifyInstallListeners(canInstall: boolean) {
  installListeners.forEach((listener) => {
    try {
      listener(canInstall);
    } catch (err) {
      console.warn("Install listener error", err);
    }
  });
}

export async function promptPwaInstall(): Promise<boolean> {
  if (!deferredInstallPrompt) {
    return false;
  }

  deferredInstallPrompt.prompt();
  const { outcome } = await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  notifyInstallListeners(false);

  return outcome === "accepted";
}

export function isRunningStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes("android-app://")
  );
}
