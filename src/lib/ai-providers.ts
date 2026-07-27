/**
 * Multi-provider AI layer (BYOK + server env fallback).
 * Supports: OpenAI (ChatGPT), Anthropic (Claude), Google (Gemini), xAI (Grok).
 */

export type AIProviderId =
  | "mock"
  | "openai"
  | "anthropic"
  | "google"
  | "xai"
  | "custom";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type RuntimeAIConfig = {
  provider: AIProviderId;
  model?: string;
  /** User-supplied key (BYOK). Never log this. */
  apiKey?: string;
  /** Only for provider === "custom" (OpenAI-compatible base URL) */
  baseUrl?: string;
};

export const PROVIDER_META: Record<
  AIProviderId,
  {
    label: string;
    description: string;
    defaultModel: string;
    models: { id: string; label: string }[];
    keyPlaceholder: string;
    docsUrl: string;
    keyEnv?: string;
  }
> = {
  mock: {
    label: "Built-in mock (offline)",
    description: "No API key — smart templates for demo.",
    defaultModel: "mock",
    models: [{ id: "mock", label: "Mock coach & planner" }],
    keyPlaceholder: "",
    docsUrl: "",
  },
  openai: {
    label: "OpenAI (ChatGPT)",
    description: "GPT-4o / GPT-4.1 family via api.openai.com",
    defaultModel: "gpt-4o-mini",
    models: [
      { id: "gpt-4o-mini", label: "GPT-4o mini (fast / cheap)" },
      { id: "gpt-4o", label: "GPT-4o" },
      { id: "gpt-4.1-mini", label: "GPT-4.1 mini" },
      { id: "gpt-4.1", label: "GPT-4.1" },
      { id: "o4-mini", label: "o4-mini" },
    ],
    keyPlaceholder: "sk-...",
    docsUrl: "https://platform.openai.com/api-keys",
    keyEnv: "OPENAI_API_KEY",
  },
  anthropic: {
    label: "Anthropic (Claude)",
    description: "Claude models via api.anthropic.com",
    defaultModel: "claude-sonnet-4-20250514",
    models: [
      { id: "claude-sonnet-4-20250514", label: "Claude Sonnet 4" },
      { id: "claude-3-5-haiku-latest", label: "Claude 3.5 Haiku" },
      { id: "claude-3-5-sonnet-latest", label: "Claude 3.5 Sonnet" },
      { id: "claude-3-opus-latest", label: "Claude 3 Opus" },
    ],
    keyPlaceholder: "sk-ant-...",
    docsUrl: "https://console.anthropic.com/settings/keys",
    keyEnv: "ANTHROPIC_API_KEY",
  },
  google: {
    label: "Google (Gemini)",
    description: "Gemini via generativelanguage.googleapis.com",
    defaultModel: "gemini-2.0-flash",
    models: [
      { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
      { id: "gemini-2.0-flash-lite", label: "Gemini 2.0 Flash Lite" },
      { id: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
      { id: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
    ],
    keyPlaceholder: "AIza...",
    docsUrl: "https://aistudio.google.com/apikey",
    keyEnv: "GOOGLE_API_KEY",
  },
  xai: {
    label: "xAI (Grok)",
    description: "Grok via api.x.ai (OpenAI-compatible)",
    defaultModel: "grok-4.5",
    models: [
      { id: "grok-4.5", label: "Grok 4.5" },
      { id: "grok-3", label: "Grok 3" },
      { id: "grok-3-mini", label: "Grok 3 mini" },
      { id: "grok-2-latest", label: "Grok 2" },
    ],
    keyPlaceholder: "xai-...",
    docsUrl: "https://console.x.ai",
    keyEnv: "XAI_API_KEY",
  },
  custom: {
    label: "Custom (OpenAI-compatible)",
    description: "Any OpenAI-compatible endpoint (Ollama, Groq, Together, etc.)",
    defaultModel: "llama-3.1-8b-instruct",
    models: [
      { id: "llama-3.1-8b-instruct", label: "Llama 3.1 8B (example)" },
      { id: "llama-3.3-70b", label: "Llama 3.3 70B (example)" },
      { id: "custom-model", label: "Custom model id (edit below)" },
    ],
    keyPlaceholder: "optional-or-ollama",
    docsUrl: "https://github.com/ollama/ollama",
  },
};

export function resolveServerKey(
  provider: AIProviderId,
  userKey?: string
): string | undefined {
  if (userKey?.trim()) return userKey.trim();
  switch (provider) {
    case "openai":
      return process.env.OPENAI_API_KEY;
    case "anthropic":
      return process.env.ANTHROPIC_API_KEY;
    case "google":
      return process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    case "xai":
      return process.env.XAI_API_KEY;
    case "custom":
      return process.env.CUSTOM_AI_API_KEY || userKey;
    default:
      return undefined;
  }
}

/** Pick effective config: user BYOK → server env → mock */
export function resolveAIConfig(input?: Partial<RuntimeAIConfig>): RuntimeAIConfig {
  if (process.env.USE_MOCK_AI === "true") {
    return { provider: "mock", model: "mock" };
  }

  const provider = (input?.provider ||
    (process.env.AI_PROVIDER as AIProviderId) ||
    "mock") as AIProviderId;

  if (provider === "mock") {
    // Auto-pick first available server key if user chose mock but env has keys
    if (!input?.provider) {
      if (process.env.XAI_API_KEY) {
        return {
          provider: "xai",
          model: process.env.AI_MODEL || PROVIDER_META.xai.defaultModel,
          apiKey: process.env.XAI_API_KEY,
        };
      }
      if (process.env.OPENAI_API_KEY) {
        return {
          provider: "openai",
          model: process.env.AI_MODEL || PROVIDER_META.openai.defaultModel,
          apiKey: process.env.OPENAI_API_KEY,
        };
      }
      if (process.env.ANTHROPIC_API_KEY) {
        return {
          provider: "anthropic",
          model: process.env.AI_MODEL || PROVIDER_META.anthropic.defaultModel,
          apiKey: process.env.ANTHROPIC_API_KEY,
        };
      }
      if (process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY) {
        return {
          provider: "google",
          model: process.env.AI_MODEL || PROVIDER_META.google.defaultModel,
          apiKey: process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY,
        };
      }
    }
    return { provider: "mock", model: "mock" };
  }

  const meta = PROVIDER_META[provider] || PROVIDER_META.mock;
  const apiKey = resolveServerKey(provider, input?.apiKey);
  const model =
    input?.model?.trim() ||
    process.env.AI_MODEL ||
    meta.defaultModel;

  if (!apiKey && provider !== "custom") {
    // Custom endpoints (Ollama) may work without a key
    return { provider: "mock", model: "mock" };
  }

  // Custom with no key still allowed if baseUrl set
  if (provider === "custom" && !input?.baseUrl && !process.env.CUSTOM_AI_BASE_URL) {
    if (!apiKey) return { provider: "mock", model: "mock" };
  }

  return {
    provider,
    model,
    apiKey,
    baseUrl:
      input?.baseUrl?.trim() ||
      process.env.CUSTOM_AI_BASE_URL ||
      undefined,
  };
}

export function hasLiveAI(config?: Partial<RuntimeAIConfig>): boolean {
  const r = resolveAIConfig(config);
  return r.provider !== "mock";
}

export type ChatResult = {
  text: string;
  provider: AIProviderId;
  model: string;
};

/**
 * Unified chat completion across providers.
 */
export async function chatCompletion(
  messages: ChatMessage[],
  options?: {
    config?: Partial<RuntimeAIConfig>;
    temperature?: number;
  }
): Promise<ChatResult> {
  const config = resolveAIConfig(options?.config);
  const temperature = options?.temperature ?? 0.5;

  if (config.provider === "mock") {
    throw new Error("MOCK_AI");
  }

  const model = config.model || PROVIDER_META[config.provider].defaultModel;

  switch (config.provider) {
    case "openai":
    case "xai":
    case "custom":
      return chatOpenAICompatible(messages, {
        provider: config.provider,
        model,
        apiKey: config.apiKey || "ollama",
        baseUrl:
          config.provider === "openai"
            ? "https://api.openai.com/v1"
            : config.provider === "xai"
              ? "https://api.x.ai/v1"
              : config.baseUrl || "http://127.0.0.1:11434/v1",
        temperature,
      });
    case "anthropic":
      return chatAnthropic(messages, {
        model,
        apiKey: config.apiKey!,
        temperature,
      });
    case "google":
      return chatGoogle(messages, {
        model,
        apiKey: config.apiKey!,
        temperature,
      });
    default:
      throw new Error(`Unsupported provider: ${config.provider}`);
  }
}

async function chatOpenAICompatible(
  messages: ChatMessage[],
  opts: {
    provider: AIProviderId;
    model: string;
    apiKey: string;
    baseUrl: string;
    temperature: number;
  }
): Promise<ChatResult> {
  const res = await fetch(`${opts.baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${opts.apiKey}`,
    },
    body: JSON.stringify({
      model: opts.model,
      temperature: opts.temperature,
      messages,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(
      `${opts.provider} error ${res.status}: ${errText.slice(0, 300)}`
    );
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = data.choices?.[0]?.message?.content?.trim() || "";
  if (!text) throw new Error(`${opts.provider} returned empty response`);
  return { text, provider: opts.provider, model: opts.model };
}

async function chatAnthropic(
  messages: ChatMessage[],
  opts: { model: string; apiKey: string; temperature: number }
): Promise<ChatResult> {
  const system = messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n\n");
  const converted = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    }));

  // Anthropic requires alternating user/assistant; merge consecutive same roles lightly
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": opts.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: opts.model,
      max_tokens: 4096,
      temperature: opts.temperature,
      system: system || undefined,
      messages: converted,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`anthropic error ${res.status}: ${errText.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    content?: { type: string; text?: string }[];
  };
  const text =
    data.content
      ?.filter((c) => c.type === "text")
      .map((c) => c.text || "")
      .join("")
      .trim() || "";
  if (!text) throw new Error("anthropic returned empty response");
  return { text, provider: "anthropic", model: opts.model };
}

async function chatGoogle(
  messages: ChatMessage[],
  opts: { model: string; apiKey: string; temperature: number }
): Promise<ChatResult> {
  const system = messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n\n");

  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(opts.model)}:generateContent?key=${encodeURIComponent(opts.apiKey)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: system
        ? { parts: [{ text: system }] }
        : undefined,
      contents,
      generationConfig: { temperature: opts.temperature },
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`google error ${res.status}: ${errText.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text =
    data.candidates?.[0]?.content?.parts
      ?.map((p) => p.text || "")
      .join("")
      .trim() || "";
  if (!text) throw new Error("google returned empty response");
  return { text, provider: "google", model: opts.model };
}

/** Parse AI config from a request body without logging secrets */
export function aiConfigFromBody(body: Record<string, unknown>): Partial<RuntimeAIConfig> {
  const ai = (body.ai || body.aiConfig || {}) as Record<string, unknown>;
  const provider = String(
    ai.provider || body.ai_provider || "mock"
  ) as AIProviderId;
  return {
    provider: PROVIDER_META[provider] ? provider : "mock",
    model: ai.model ? String(ai.model) : body.ai_model ? String(body.ai_model) : undefined,
    apiKey: ai.apiKey
      ? String(ai.apiKey)
      : body.apiKey
        ? String(body.apiKey)
        : undefined,
    baseUrl: ai.baseUrl
      ? String(ai.baseUrl)
      : body.baseUrl
        ? String(body.baseUrl)
        : undefined,
  };
}
