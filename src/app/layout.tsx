import type { Metadata } from "next";
import "./globals.css";
import { DemoProvider } from "@/components/demo/demo-context";
import { DemoGate } from "@/components/demo/demo-gate";
import { DemoBadge } from "@/components/demo/demo-badge";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Alma — Lead Management (Demo)",
  description:
    "Submit your application and our attorneys will reach out to you.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <DemoProvider>
          <SiteHeader />
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
            <DemoGate>{children}</DemoGate>
          </main>
          <DemoBadge />
        </DemoProvider>
      </body>
    </html>
  );
}
