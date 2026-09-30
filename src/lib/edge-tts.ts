import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const detectSpeechLanguage = createServerFn({ method: "POST" })
  .inputValidator(z.object({ text: z.string().trim().min(1).max(12000) }))
  .handler(async ({ data }) => {
    const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&dt=ld&q=${encodeURIComponent(data.text)}`);
    if (!response.ok) return { ok: false as const, error: "تشخیص زبان انجام نشد." };
    const payload = await response.json() as unknown[];
    const detected = typeof payload[2] === "string" ? payload[2] : null;
    return detected ? { ok: true as const, language: detected } : { ok: false as const, error: "زبان متن تشخیص داده نشد." };
  });

