"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { GridSize, GallerySort } from "@/components/gallery/grid-controls";

export interface AppSettings {
  defaultGridSize: GridSize;
  defaultSort: GallerySort;
  [key: string]: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  defaultGridSize: "medium",
  defaultSort: "modified-desc",
};

interface SettingsContextValue {
  settings: AppSettings;
  loading: boolean;
  updateSetting: (key: string, value: string) => Promise<void>;
  updateSettings: (newSettings: Record<string, string>) => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(
  undefined,
);

function getCachedInitialSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const cachedGrid = window.localStorage.getItem("gallery-default-grid-size");
    const cachedSort = window.localStorage.getItem("gallery-default-sort");
    return {
      defaultGridSize:
        cachedGrid === "small" ||
        cachedGrid === "medium" ||
        cachedGrid === "large"
          ? cachedGrid
          : "medium",
      defaultSort:
        cachedSort === "modified-desc" ||
        cachedSort === "name-asc" ||
        cachedSort === "name-desc"
          ? cachedSort
          : "modified-desc",
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() =>
    getCachedInitialSettings(),
  );
  const [loading, setLoading] = useState(true);

  const refreshSettings = useCallback(async () => {
    try {
      const response = await fetch("/api/settings", { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as {
        settings?: Record<string, string>;
      };
      if (data.settings) {
        const merged: AppSettings = {
          defaultGridSize:
            data.settings.defaultGridSize === "small" ||
            data.settings.defaultGridSize === "medium" ||
            data.settings.defaultGridSize === "large"
              ? data.settings.defaultGridSize
              : "medium",
          defaultSort:
            data.settings.defaultSort === "modified-desc" ||
            data.settings.defaultSort === "name-asc" ||
            data.settings.defaultSort === "name-desc"
              ? data.settings.defaultSort
              : "modified-desc",
          ...data.settings,
        };
        setSettings(merged);
        // Sync local cache
        try {
          window.localStorage.setItem(
            "gallery-default-grid-size",
            merged.defaultGridSize,
          );
          window.localStorage.setItem(
            "gallery-default-sort",
            merged.defaultSort,
          );
        } catch {
          // ignore
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/settings", { cache: "no-store" })
      .then(async (response) => {
        if (!active || !response.ok) return;
        const data = (await response.json()) as {
          settings?: Record<string, string>;
        };
        if (data.settings && active) {
          const merged: AppSettings = {
            defaultGridSize:
              data.settings.defaultGridSize === "small" ||
              data.settings.defaultGridSize === "medium" ||
              data.settings.defaultGridSize === "large"
                ? data.settings.defaultGridSize
                : "medium",
            defaultSort:
              data.settings.defaultSort === "modified-desc" ||
              data.settings.defaultSort === "name-asc" ||
              data.settings.defaultSort === "name-desc"
                ? data.settings.defaultSort
                : "modified-desc",
            ...data.settings,
          };
          setSettings(merged);
          try {
            window.localStorage.setItem(
              "gallery-default-grid-size",
              merged.defaultGridSize,
            );
            window.localStorage.setItem(
              "gallery-default-sort",
              merged.defaultSort,
            );
          } catch {
            // ignore
          }
        }
      })
      .catch(() => {
        // ignore
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const updateSettings = useCallback(
    async (newSettings: Record<string, string>) => {
      // Optimistic update
      setSettings((prev) => {
        const next = { ...prev, ...newSettings };
        if (newSettings.defaultGridSize) {
          next.defaultGridSize = newSettings.defaultGridSize as GridSize;
          try {
            window.localStorage.setItem(
              "gallery-default-grid-size",
              newSettings.defaultGridSize,
            );
          } catch {
            // ignore
          }
        }
        if (newSettings.defaultSort) {
          next.defaultSort = newSettings.defaultSort as GallerySort;
          try {
            window.localStorage.setItem(
              "gallery-default-sort",
              newSettings.defaultSort,
            );
          } catch {
            // ignore
          }
        }
        return next;
      });

      // Persist to SQLite Database via API
      try {
        await fetch("/api/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ settings: newSettings }),
        });
      } catch {
        // ignore network error
      }
    },
    [],
  );

  const updateSetting = useCallback(
    async (key: string, value: string) => {
      await updateSettings({ [key]: value });
    },
    [updateSettings],
  );

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loading,
        updateSetting,
        updateSettings,
        refreshSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useAppSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useAppSettings must be used within a SettingsProvider");
  }
  return context;
}
