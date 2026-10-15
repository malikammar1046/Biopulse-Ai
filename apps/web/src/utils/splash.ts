/**
 * Global BioPulse App Splash Screen Controller
 *
 * Coordinates the single, continuous, hardware-accelerated splash screen
 * from initial HTML parse through React hydration and authentication readiness.
 */

let splashDismissed = false;

export function dismissAppSplash(): void {
  if (splashDismissed) return;
  splashDismissed = true;

  if (typeof window === 'undefined') return;

  if (typeof (window as any).__dismissAppSplash === 'function') {
    (window as any).__dismissAppSplash();
    return;
  }

  const splash = document.getElementById('app-splash');
  if (splash) {
    splash.classList.add('splash-dismissed');
    setTimeout(() => {
      if (splash.parentNode) {
        splash.parentNode.removeChild(splash);
      }
    }, 450);
  }
}
