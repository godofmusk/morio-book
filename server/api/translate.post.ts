import { defineEventHandler, readBody, setResponseStatus } from "h3";

const MEDICAL_DICTIONARY: Record<string, string> = {
  "blood pressure": "فشار خون",
  "heart rate": "ضربان قلب",
  "heart failure": "نارسایی قلبی",
  "blood glucose": "قند خون",
  "blood sugar": "قند خون",
  "diabetes mellitus": "دیابت شیرین",
  "type 2 diabetes": "دیابت نوع ۲",
  hypertension: "پرفشاری خون",
  hypotension: "افت فشار خون",
  "myocardial infarction": "سکته قلبی",
  stroke: "سکته مغزی",
  inflammation: "التهاب",
  infection: "عفونت",
  "immune system": "سیستم ایمنی",
  "side effects": "عوارض جانبی",
  "clinical trial": "کارآزمایی بالینی",
  diagnosis: "تشخیص",
  treatment: "درمان",
  prescription: "نسخه پزشکی",
  symptom: "علامت بیماری",
};

async function medicalTranslation(text: string, sourceLang: string, targetLang: string) {
  if (sourceLang === "en" && targetLang === "fa") {
    let translated = text;
    for (const [term, value] of Object.entries(MEDICAL_DICTIONARY)) {
      translated = translated.replace(new RegExp(`\\b${term.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}\\b`, "gi"), value);
    }
    if (translated !== text) return { text: translated };
  }

  const google = new URL("https://translate.googleapis.com/translate_a/single");
  google.searchParams.set("client", "gtx");
  google.searchParams.set("sl", sourceLang || "auto");
  google.searchParams.set("tl", targetLang || "fa");
  google.searchParams.set("dt", "t");
  google.searchParams.set("q", text);
  const response = await fetch(google);
  if (!response.ok) throw new Error("translation provider unavailable");
  const data = (await response.json()) as unknown;
  if (!Array.isArray(data) || !Array.isArray(data[0])) throw new Error("invalid translation response");
  const translated = data[0]
    .map((chunk) => (Array.isArray(chunk) && typeof chunk[0] === "string" ? chunk[0] : ""))
    .join("")
    .trim();
  if (!translated) throw new Error("empty translation");
  return { text: translated, detected: typeof data[2] === "string" ? data[2] : undefined };
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<{ text?: unknown; sourceLang?: unknown; targetLang?: unknown }>(event);
    const text = typeof body?.text === "string" ? body.text.trim().slice(0, 5000) : "";
    const sourceLang = typeof body?.sourceLang === "string" ? body.sourceLang : "en";
    const targetLang = typeof body?.targetLang === "string" ? body.targetLang : "fa";
    if (!text) {
      setResponseStatus(event, 400);
      return { ok: false, error: "متنی برای ترجمه وجود ندارد" };
    }
    const result = await medicalTranslation(text, sourceLang, targetLang);
    return { ok: true, ...result };
  } catch {
    setResponseStatus(event, 502);
    return { ok: false, error: "ترجمه در حال حاضر در دسترس نیست" };
  }
});
