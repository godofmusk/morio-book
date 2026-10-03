import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import appCss from "../styles.css?url";

const APP_NAME = "Morio Book";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      {
        name: "description",
        content: "Morio Book؛ کتاب‌خوان PDF برای ترجمه و پخش صوت متن",
      },
      { property: "og:title", content: APP_NAME },
      {
        property: "og:description",
        content: "Morio Book؛ کتاب‌خوان PDF برای ترجمه و پخش صوت متن",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: APP_NAME },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: APP_NAME },
      {
        name: "twitter:description",
        content: "Morio Book؛ کتاب‌خوان PDF برای ترجمه و پخش صوت متن",
      },
      { name: "application-name", content: APP_NAME },
      { name: "apple-mobile-web-app-title", content: APP_NAME },
      { name: "theme-color", content: "#000000" },
    ],
    links: [
      { rel: "icon", type: "image/png", href: "/morio-book-icon.png" },
      { rel: "stylesheet", href: appCss },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;600;700&display=swap",
      },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
    ],
  }),
  component: () => (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="antialiased">
        <PreviewHostBridge />
        <AuthProvider>
          <Outlet />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
});
