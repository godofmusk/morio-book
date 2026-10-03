export type TranslateResult =
  | { ok: true; text: string; detected?: string }
  | { ok: false; error: string };

type TranslateInput = {
  text: string;
  sourceLang: string;
  targetLang: string;
};

export async function translateText(input: TranslateInput): Promise<TranslateResult> {
  try {
    const params = new URLSearchParams({
      client: "gtx",
      sl: input.sourceLang === "auto" ? "auto" : input.sourceLang,
      tl: input.targetLang,
      dt: "t",
      q: input.text,
    });
    const response = await fetch(`https://translate.googleapis.com/translate_a/single?${params.toString()}`);
    if (!response.ok) return { ok: false, error: "ترجمه در دسترس نیست" };

    const payload = (await response.json()) as unknown[];
    const segments = Array.isArray(payload[0]) ? payload[0] : [];
    const text = segments
      .map((segment) => (Array.isArray(segment) && typeof segment[0] === "string" ? segment[0] : ""))
      .join("")
      .trim();

    return text ? { ok: true, text } : { ok: false, error: "ترجمه‌ای دریافت نشد" };
  } catch {
    return { ok: false, error: "خطا در ترجمه. دوباره تلاش کنید." };
  }
}
