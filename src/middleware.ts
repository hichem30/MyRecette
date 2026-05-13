import createMiddleware from "next-intl/middleware";
import { defineRouting } from "next-intl/routing";
import { locales, defaultLocale } from "./lib/i18n/config";

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "as-needed",
});

export default createMiddleware(routing);

export const config = {
  matcher: [
    // Match all paths except api, admin, auth, _next, _vercel, files with an extension
    "/((?!api|admin|auth|_next|_vercel|.*\\..*).*)",
  ],
};
