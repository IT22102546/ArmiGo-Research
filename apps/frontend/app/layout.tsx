import "./globals.css";
import dynamicImport from "next/dynamic";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

// Dynamically import client components with SSR disabled
const Providers = dynamicImport(
  () =>
    import("@/components/providers/Providers").then((mod) => ({
      default: mod.Providers,
    })),
  { ssr: false }
);

const NotificationToast = dynamicImport(
  () =>
    import("@/components/shared/NotificationToast").then((mod) => ({
      default: mod.NotificationToast,
    })),
  { ssr: false }
);

const ImpersonationBanner = dynamicImport(
  () =>
    import("@/components/features/admin/ImpersonationBanner").then((mod) => ({
      default: mod.ImpersonationBanner,
    })),
  { ssr: false }
);

const Toaster = dynamicImport(
  () =>
    import("@/components/shared/Toaster").then((mod) => ({
      default: mod.Toaster,
    })),
  { ssr: false }
);

export const metadata = {
  title: "ArmiGo Platform",
  description: "Empowering Rehabilation",
};

// Force dynamic rendering - no static generation
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <ErrorBoundary>
          <NextIntlClientProvider messages={messages}>
            <Providers>
              <ImpersonationBanner />
              {children}
              <NotificationToast />
            </Providers>
          </NextIntlClientProvider>
        </ErrorBoundary>
        <Toaster />
      </body>
    </html>
  );
}
