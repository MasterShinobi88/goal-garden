/**
 * Desktop (Electron) detection + helpers
 */

export type DesktopInfo = {
  isDesktop: boolean;
  isPackaged?: boolean;
  version?: string;
  platform?: string;
  userData?: string;
};

declare global {
  interface Window {
    goalGarden?: {
      isDesktop: boolean;
      getInfo: () => Promise<DesktopInfo>;
    };
  }
}

/** True when running inside the Electron shell or a desktop-targeted build */
export function isDesktopApp(): boolean {
  if (typeof window !== "undefined" && window.goalGarden?.isDesktop) {
    return true;
  }
  return process.env.NEXT_PUBLIC_DESKTOP === "true";
}

export async function getDesktopInfo(): Promise<DesktopInfo | null> {
  if (typeof window === "undefined" || !window.goalGarden?.getInfo) {
    if (isDesktopApp()) return { isDesktop: true };
    return null;
  }
  try {
    return await window.goalGarden.getInfo();
  } catch {
    return { isDesktop: true };
  }
}
