"use client";

/**
 * Client-side fetch wrapper that attaches whatever the server's
 * getVerifiedUser() (app/lib/auth.ts) needs to identify the caller — a real
 * Supabase session token in production, or the dev-mode phone header on
 * localhost, so no call site has to hand-roll the header.
 *
 * The Group 1 routes verify this (save-profile, save-user-type,
 * manufacturer-profile, profile-data). The remaining 14 routes still trust
 * the phone in the request body and ignore what this sends — see TASKS.md
 * "Group 2/3 route auth". Sending it anyway is harmless and means those
 * call sites need no change when their route is converted.
 */

import { supabase } from "./supabase";

const isDev =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1");

// Shown when authFetch itself throws — the request never reached the
// server (offline, DNS failure, dev server down).
export const NETWORK_ERROR_MESSAGE =
  "Couldn't reach the server. Please check your connection and try again.";

/**
 * Turns a failed save response into a message that tells the user whether
 * retrying will help.
 *
 * 503 means the database was unreachable — retrying is exactly right.
 * 401/403 mean the session is gone or wrong — retrying will never work and
 * the user must log in again. Showing one generic message for both sends
 * people into pointless retry loops (or pointless re-logins).
 */
export async function readSaveError(res: Response): Promise<string> {
  const body = await res.json().catch(() => ({ error: null }));

  if (res.status === 503) return NETWORK_ERROR_MESSAGE;
  if (res.status === 401 || res.status === 403) {
    return "Your session has expired. Please log in again.";
  }

  // NEVER surface a 5xx body. It carries internal exception text — a
  // database outage once put a literal "TypeError: fetch failed" on the
  // onboarding screen, because this fell through to `body.error` for any
  // status it didn't name. Meaningless to the user, and it leaks
  // implementation detail. Routes converted to dbErrorResponse() return 503
  // for an unreachable database and reach the branch above; a 500 here is a
  // genuine server-side fault, so the wording differs from the 503 case —
  // retrying a real fault is far less likely to help.
  //
  // 4xx bodies ARE shown: those are our own validation messages
  // ("phone is required") and are written for the user.
  if (res.status >= 500) {
    return "Something went wrong on our end. Please try again.";
  }

  return body?.error || "Something went wrong. Please try again.";
}

export async function authFetch(input: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);

  if (isDev) {
    try {
      const auth = JSON.parse(localStorage.getItem("fabverify_auth") || "{}");
      if (auth.phone) headers.set("x-dev-phone", auth.phone);
    } catch {
      // Malformed/missing localStorage entry — send no identity, same as
      // an anonymous caller.
    }
  } else {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) {
      headers.set("Authorization", `Bearer ${data.session.access_token}`);
    }
  }

  return fetch(input, { ...init, headers });
}
