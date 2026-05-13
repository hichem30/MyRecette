import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { locales, defaultLocale, type Locale } from "./config";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale: Locale = hasLocale(locales, requested) ? requested : defaultLocale;
  return {
    locale,
    messages: (await import(`../../../messages/${locale}.json`)).default,
  };
});
