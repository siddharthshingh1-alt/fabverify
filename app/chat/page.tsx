"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/app/context/UserContext";
import { getChatPath } from "./data";

export default function ChatRedirect() {
  const router = useRouter();
  const { user, mounted } = useUser();

  useEffect(() => {
    if (!mounted) return;
    router.replace(getChatPath(user.userType, Boolean(user.position)));
  }, [mounted, user, router]);

  return (
    <div className="flex h-full min-h-screen w-full items-center justify-center bg-background">
      <p className="text-sm text-text-secondary">Opening messages...</p>
    </div>
  );
}
