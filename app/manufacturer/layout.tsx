import type { ReactNode } from "react";
import AuthGuard from "@/app/components/AuthGuard";

// Platform route tree — requires a signed-in account. The guard lives in the
// layout, not the pages, so every current AND future route under /manufacturer
// inherits it and none can be forgotten. See app/components/AuthGuard.tsx.
export default function ManufacturerLayout({ children }: { children: ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}
