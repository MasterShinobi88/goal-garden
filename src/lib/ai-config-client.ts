"use client";

import type { AIProviderId } from "./ai-providers";
import { PROVIDER_META } from "./ai-providers";

const STORAGE_KEY = "goal-garden:ai-connection";

export type StoredAIConnection = {
  provider: AIProviderId;
  model: string;
  /** Stored only in this browser (BYOK). Never send to third parties except via our API routes. */
  apiKey: string;
  baseUrl?: string;
  /** Show connected badge */
  enabled: boolean;
  updatedAt?: string;
};

export function defaultAIConnection(): StoredAIConnection {
  return {
    provider: "mock",
    model: "mock",
    apiKey: "",
    baseUrl: "",
    enabled: false,
  };
}

export function loadAIConnection(): StoredAIConnection {
  if (typeof window === "undefined") return defaultAIConnection();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultAIConnection();
    const parsed = JSON.parse(raw) as StoredAIConnection;
    return { ...defaultAIConnection(), ...parsed };
  } catch {
    return defaultAIConnection();
  }
}

export function saveAIConnection(conn: StoredAIConnection) {
  const next = {
    ...conn,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("goal-garden:ai-config"));
  return next;
}

export function clearAIConnection() {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("goal-garden:ai-config"));
}

/** Payload safe to POST to our Next.js API routes (key only if user enabled BYOK). */
export function getAIRequestPayload(): {
  provider: AIProviderId;
  model?: string;
  apiKey?: string;
  baseUrl?: string;
} {
  const c = loadAIConnection();
  if (!c.enabled || c.provider === "mock") {
    return { provider: "mock" };
  }
  return {
    provider: c.provider,
    model: c.model || PROVIDER_META[c.provider]?.defaultModel,
    apiKey: c.apiKey || undefined,
    baseUrl: c.provider === "custom" ? c.baseUrl || undefined : undefined,
  };
}

export function connectionStatusLabel(c: StoredAIConnection): string {
  if (!c.enabled || c.provider === "mock") return "Using built-in mock AI";
  const label = PROVIDER_META[c.provider]?.label || c.provider;
  const hasKey = Boolean(c.apiKey?.trim()) || c.provider === "custom";
  if (!hasKey) return `${label} — missing API key`;
  return `Connected · ${label} · ${c.model}`;
}

export function maskKey(key: string): string {
  if (!key) return "";
  if (key.length <= 8) return "••••••••";
  return `${key.slice(0, 4)}…${key.slice(-4)}`;
}
