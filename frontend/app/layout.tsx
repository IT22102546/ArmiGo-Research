import "./globals.css";
import { Providers } from "./providers";

import { Toaster } from "sonner";

export const metadata = {
  title: "LearnUp Platform",
  description: "Empowering education",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
        <Toaster position="top-center" duration={4000} richColors closeButton />
      </body>
    </html>
  );
}
