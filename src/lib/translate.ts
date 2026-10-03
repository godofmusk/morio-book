export type TranslateResult =
  | { ok: true; text: string; detected?: string }
  | { ok: false; error: string };

import type { TranslationProviderId } from "./store";

type TranslateInput = {
  text: string;
  sourceLang: string;
  targetLang: string;
  providers?: TranslationProviderId[];
};

type ProviderResult = { text: string; detected?: string };

async function requestProvider(provider: TranslationProviderId, input: TranslateInput): Promise<ProviderResult> {
  const source = input.sourceLang === "auto" ? "auto" : input.sourceLang;
  if (provider === "mymemory") {
    const params = new URLSearchParams({ q: input.text, langpair: `${source}|${input.targetLang}` });
    const response = await fetch(`https://api.mymemory.translated.net/get?${params.toString()}`);
    if (!response.ok) throw new Error("MyMemory unavailable");
    const payload = await response.json() as { responseData?: { translatedText?: string } };
    const text = payload.responseData?.translatedText?.trim();
    if (!text) throw new Error("MyMemory returned no translation");
    return { text };
  }

  if (provider === "lingva") {
    const response = await fetch(`https://lingva.ml/api/v1/${encodeURIComponent(source)}/${encodeURIComponent(input.targetLang)}/${encodeURIComponent(input.text)}`);
    if (!response.ok) throw new Error("Lingva unavailable");
    const payload = await response.json() as { translation?: string };
    const text = payload.translation?.trim();
    if (!text) throw new Error("Lingva returned no translation");
    return { text };
  }

  if (provider === "google") {
    const params = new URLSearchParams({ client: "gtx", sl: source, tl: input.targetLang, dt: "t", q: input.text });
    const response = await fetch(`https://translate.googleapis.com/translate_a/single?${params.toString()}`);
    if (!response.ok) throw new Error("Google unavailable");
    const payload = await response.json() as unknown[];
    const segments = Array.isArray(payload[0]) ? payload[0] : [];
    const text = segments.map((segment) => (Array.isArray(segment) && typeof segment[0] === "string" ? segment[0] : "")).join("").trim();
    if (!text) throw new Error("Google returned no translation");
    return { text, detected: typeof payload[2] === "string" ? payload[2] : undefined };
  }

  throw new Error("Unsupported provider");
}

export async function translateText(input: TranslateInput): Promise<TranslateResult> {
  const providers = (input.providers?.length ? input.providers : ["mymemory", "lingva", "google"]) as TranslationProviderId[];
  let lastError = "ترجمه در دسترس نیست";
  for (const provider of providers) {
    if (provider === "medical") continue;
    try {
      return { ok: true, ...(await requestProvider(provider, input)) };
    } catch (error) {
      lastError = error instanceof Error ? error.message : lastError;
    }
  }
  return { ok: false, error: lastError === "ترجمه در دسترس نیست" ? lastError : "هیچ سرویس ترجمه‌ای در دسترس نیست" };
}
