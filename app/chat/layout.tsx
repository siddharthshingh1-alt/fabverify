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

// themeColor lives on `viewport`, not `metadata`, as of the Next.js version
// this app is on (see node_modules/next/dist/docs/.../generate-viewport.md) —
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
