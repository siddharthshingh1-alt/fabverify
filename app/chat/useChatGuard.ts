"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/app/context/UserContext";
import { getChatRole, type ChatRole } from "./data";

/**
 * Gates a per-role /chat/* route. Bounces to /chat (the smart redirector)
 * if the signed-in user doesn't belong on this particular chat screen.
 */
export function useChatGuard(expectedRole: ChatRole) {
  const { user, mounted } = useUser();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (!mounted) return;
    const role = getChatRole(user.userType, Boolean(user.position));
    if (role !== expectedRole) {
      router.replace("/chat");
      return;
    }
    setAuthorized(true);
  }, [mounted, user, expectedRole, router]);

  return authorized;
}
