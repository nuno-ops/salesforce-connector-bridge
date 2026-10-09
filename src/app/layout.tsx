import "@fontsource-variable/manrope";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource/ibm-plex-mono/600.css";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://salesforcesaver.com"),
  title: { default: "Salesforce Saver: find wasted Salesforce licenses", template: "%s · Salesforce Saver" },
  description:
    "Connect your Salesforce org and see, in minutes, how much you can save on inactive users, integration licenses, Platform downgrades and unused seats.",
  openGraph: { images: ["/og-image.png"] },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
