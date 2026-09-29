import { createServerFn } from "@tanstack/react-start";
import { languageLabel } from "./languages";
import {
  DEFAULT_TRANSLATION_PROVIDERS,
  type TranslationProviderId,
  type TranslationProviderSetting,
} from "./store";

export type TranslateResult =
  | { ok: true; text: string; detected?: string }
  | { ok: false; error: string };

type TranslateInput = {
  text: string;
  sourceLang: string;
  targetLang: string;
  providers?: TranslationProviderSetting[];
};

type ImageTranslateInput = {
  image: string;
  sourceLang: string;
  targetLang: string;
};

function sanitizeImageInput(input: unknown): ImageTranslateInput {
  const data = input as Partial<ImageTranslateInput>;
  const image = typeof data.image === "string" ? data.image : "";
  if (!image.startsWith("data:image/")) throw new Error("تصویر صفحه معتبر نیست");
  return {
    image: image.slice(0, 8_000_000),
    sourceLang: typeof data.sourceLang === "string" ? data.sourceLang : "auto",
    targetLang: typeof data.targetLang === "string" ? data.targetLang : "fa",
  };
}

async function extractTextFromImage(input: ImageTranslateInput): Promise<string | null> {
  const form = new FormData();
  form.append("base64Image", input.image);
  form.append("language", input.sourceLang === "auto" ? "eng" : input.sourceLang);
  form.append("isOverlayRequired", "false");
  form.append("OCREngine", "2");
  const response = await fetch("https://api.ocr.space/parse/image", {
    method: "POST",
    headers: { apikey: "helloworld" },
    body: form,
  });
  if (!response.ok) return null;
  const body = (await response.json()) as {
    IsErroredOnProcessing?: boolean;
    ParsedResults?: { ParsedText?: string }[];
  };
  if (body.IsErroredOnProcessing) return null;
  const text = body.ParsedResults?.map((result) => result.ParsedText ?? "")
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return text || null;
}

function sanitizeInput(input: unknown): TranslateInput {
  const data = input as Partial<TranslateInput>;
  const text = typeof data.text === "string" ? data.text.trim() : "";
  if (!text) throw new Error("متنی برای ترجمه وجود ندارد");
  return {
    text: text.slice(0, 5000),
    sourceLang: typeof data.sourceLang === "string" ? data.sourceLang : "auto",
    targetLang: typeof data.targetLang === "string" ? data.targetLang : "fa",
  };
}

type ProviderResult = { text: string; detected?: string };

async function translateWithMyMemory(input: TranslateInput): Promise<ProviderResult | null> {
  const url = new URL("https://api.mymemory.translated.net/get");
  url.searchParams.set("q", input.text);
  url.searchParams.set("langpair", `${input.sourceLang === "auto" ? "autodetect" : input.sourceLang}|${input.targetLang}`);
  const res = await fetch(url.toString());
  if (!res.ok) return null;
  const body = (await res.json()) as { responseStatus?: number; responseData?: { translatedText?: string } };
  if (body.responseStatus !== 200) return null;
  const text = body.responseData?.translatedText?.trim();
  return text ? { text } : null;
}

async function translateWithLingva(input: TranslateInput): Promise<ProviderResult | null> {
  const source = input.sourceLang === "auto" ? "auto" : input.sourceLang;
  const url = `https://lingva.ml/api/v1/${encodeURIComponent(source)}/${encodeURIComponent(input.targetLang)}/${encodeURIComponent(input.text)}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const body = (await res.json()) as { translation?: string };
  const text = body.translation?.trim();
  return text ? { text } : null;
}

async function translateWithProvider(id: TranslationProviderId, input: TranslateInput): Promise<ProviderResult | null> {
  if (id === "google") return translateWithGoogle(input);
  if (id === "mymemory") return translateWithMyMemory(input);
  return translateWithLingva(input);
}

async function translateWithProviders(input: TranslateInput, settings: TranslationProviderSetting[] = DEFAULT_TRANSLATION_PROVIDERS): Promise<ProviderResult | null> {
  for (const provider of settings) {
    if (!provider.enabled) continue;
    try {
      const result = await translateWithProvider(provider.id, input);
      if (result) return result;
    } catch {
      // Continue to the next provider when a public endpoint is unavailable.
    }
  }
  return null;
}

async function translateWithGoogle(
  input: TranslateInput,
): Promise<{ text: string; detected?: string } | null> {
  const url = new URL("https://translate.googleapis.com/translate_a/single");
  url.searchParams.set("client", "gtx");
  url.searchParams.set("sl", input.sourceLang === "auto" ? "auto" : input.sourceLang);
  url.searchParams.set("tl", input.targetLang);
  url.searchParams.set("dt", "t");
  url.searchParams.set("q", input.text);

  const res = await fetch(url.toString());
  if (!res.ok) return null;
  const data = (await res.json()) as unknown;
  if (!Array.isArray(data) || !Array.isArray(data[0])) return null;
  const chunks = data[0] as Array<unknown>;
  const text = chunks
    .map((chunk) => (Array.isArray(chunk) && typeof chunk[0] === "string" ? chunk[0] : ""))
    .join("")
    .trim();
  if (!text) return null;
  const detected = typeof data[2] === "string" ? data[2] : undefined;
  return { text, detected };
}

export const translateImage = createServerFn({ method: "POST" })
  .validator(sanitizeImageInput)
  .handler(async ({ data }): Promise<TranslateResult> => {
    try {
      const text = await extractTextFromImage(data);
      if (!text) return { ok: false, error: "متنی از تصویر صفحه خوانده نشد" };
      const translated = await translateWithProviders({
        text,
        sourceLang: data.sourceLang,
        targetLang: data.targetLang,
      });
      if (translated) return { ok: true, text: translated.text, detected: translated.detected };
      return { ok: false, error: "ترجمه در حال حاضر در دسترس نیست" };
    } catch {
      return { ok: false, error: "خطا در خواندن یا ترجمه تصویر صفحه" };
    }
  });

export const translateText = createServerFn({ method: "POST" })
  .validator(sanitizeInput)
  .handler(async ({ data }): Promise<TranslateResult> => {
    try {
      const translated = await translateWithProviders(data, data.providers);
      if (translated) return { ok: true, text: translated.text, detected: translated.detected };

      return { ok: false, error: "ترجمه در حال حاضر در دسترس نیست" };
    } catch {
      return { ok: false, error: "خطا در ترجمه. دوباره تلاش کنید." };
    }
  });
