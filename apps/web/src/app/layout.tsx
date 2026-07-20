import type { Metadata } from "next";

import { Providers } from "./providers";
import "../index.css";

export const metadata: Metadata = {
  title: "Forge",
  description: "A focused toolkit for software development workflows.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
