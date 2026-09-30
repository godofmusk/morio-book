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
    const response = await fetch("/api/translate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
    const result = (await response.json()) as TranslateResult;
    return response.ok ? result : { ok: false, error: result.ok ? "ترجمه در دسترس نیست" : result.error };
  } catch {
    return { ok: false, error: "خطا در ترجمه. دوباره تلاش کنید." };
  }
}
