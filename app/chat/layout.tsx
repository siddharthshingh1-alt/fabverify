import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import ChatAuthGuard from "./components/ChatAuthGuard";
import ChatShell from "./components/ChatShell";

export const metadata: Metadata = {
  title: "FabChat — FabVerify Messages",
  description: "Chat with your garment industry contacts. View orders. Scan QR codes.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FabChat",
  },
  manifest: "/chat-manifest.json",
};

// themeColor moved from `metadata` to `viewport` in the Next.js App Router
// Metadata API (see https://nextjs.org/docs/app/api-reference/functions/generate-viewport) —
// nesting it under `metadata` as older Next versions did is a build warning here.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#07122a",
};

export default function ChatLayout({ children }: { children: ReactNode }) {
  return (
    <ChatAuthGuard>
      <ChatShell>{children}</ChatShell>
    </ChatAuthGuard>
  );
}
