import { create } from "zustand";
import { persist } from "zustand/middleware";

export type TranslateMode = "split" | "replace" | "float";
export type ThemeMode = "system" | "light" | "dark";
export type TranslationProviderId = "google" | "mymemory" | "lingva";

export type TranslationProviderSetting = {
  id: TranslationProviderId;
  enabled: boolean;
};

export const DEFAULT_TRANSLATION_PROVIDERS: TranslationProviderSetting[] = [
  { id: "google", enabled: true },
  { id: "mymemory", enabled: true },
  { id: "lingva", enabled: true },
];

export type HistoryItem = {
  id: string;
  source: string;
  translation: string;
  sourceLang: string;
  targetLang: string;
  ts: number;
};

type SettingsState = {
  theme: ThemeMode;
  sourceLang: string;
  targetLang: string;
  mode: TranslateMode;
  autoTranslate: boolean;
  pdfDarkMode: boolean;
  bookmarksOpen: boolean;
  page: number;
  zoom: number;
  pdfSource: "default" | "upload";
  uploadName: string;
  history: HistoryItem[];
  translationProviders: TranslationProviderSetting[];
  setTheme: (theme: ThemeMode) => void;
  setSourceLang: (code: string) => void;
  setTargetLang: (code: string) => void;
  setMode: (mode: TranslateMode) => void;
  setAutoTranslate: (value: boolean) => void;
  setPdfDarkMode: (value: boolean) => void;
  setBookmarksOpen: (value: boolean) => void;
  setPage: (page: number) => void;
  setZoom: (zoom: number) => void;
  setPdfSource: (source: "default" | "upload", name?: string) => void;
  setTranslationProviderEnabled: (id: TranslationProviderId, enabled: boolean) => void;
  moveTranslationProvider: (id: TranslationProviderId, direction: "up" | "down") => void;
  addHistory: (item: Omit<HistoryItem, "id" | "ts">) => void;
  clearHistory: () => void;
};

export const DEFAULT_PDF_URL = "/book.pdf";

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      theme: "system",
      sourceLang: "auto",
      targetLang: "fa",
      mode: "split",
      autoTranslate: false,
      pdfDarkMode: false,
      bookmarksOpen: true,
      page: 1,
      zoom: 1,
      pdfSource: "default",
      uploadName: "",
      history: [],
      translationProviders: DEFAULT_TRANSLATION_PROVIDERS,
      setTheme: (theme) => set({ theme }),
      setSourceLang: (sourceLang) => set({ sourceLang }),
      setTargetLang: (targetLang) => set({ targetLang }),
      setMode: (mode) => set({ mode }),
      setAutoTranslate: (autoTranslate) => set({ autoTranslate }),
      setPdfDarkMode: (pdfDarkMode) => set({ pdfDarkMode }),
      setBookmarksOpen: (bookmarksOpen) => set({ bookmarksOpen }),
      setPage: (page) => set({ page: Math.max(1, page) }),
      setZoom: (zoom) => set({ zoom: Math.min(3, Math.max(0.2, zoom)) }),
      setPdfSource: (pdfSource, name) =>
        set({
          pdfSource,
          uploadName: pdfSource === "upload" ? (name ?? "") : "",
          page: 1,
        }),
      setTranslationProviderEnabled: (id, enabled) =>
        set((state) => ({
          translationProviders: state.translationProviders.map((provider) =>
            provider.id === id ? { ...provider, enabled } : provider,
          ),
        })),
      moveTranslationProvider: (id, direction) =>
        set((state) => {
          const index = state.translationProviders.findIndex((provider) => provider.id === id);
          const nextIndex = direction === "up" ? index - 1 : index + 1;
          if (index < 0 || nextIndex < 0 || nextIndex >= state.translationProviders.length) return state;
          const translationProviders = [...state.translationProviders];
          [translationProviders[index], translationProviders[nextIndex]] = [translationProviders[nextIndex], translationProviders[index]];
          return { translationProviders };
        }),
      addHistory: (item) =>
        set((state) => ({
          history: [
            {
              ...item,
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              ts: Date.now(),
            },
            ...state.history,
          ].slice(0, 40),
        })),
      clearHistory: () => set({ history: [] }),
    }),
    {
      name: "tarjomaan-settings",
      partialize: (state) => ({
        theme: state.theme,
        sourceLang: state.sourceLang,
        targetLang: state.targetLang,
        mode: state.mode,
        autoTranslate: state.autoTranslate,
        pdfDarkMode: state.pdfDarkMode,
        bookmarksOpen: state.bookmarksOpen,
        page: state.page,
        zoom: state.zoom,
        pdfSource: state.pdfSource,
        uploadName: state.uploadName,
        history: state.history.slice(0, 12),
        translationProviders: state.translationProviders,
      }),
    },
  ),
);
