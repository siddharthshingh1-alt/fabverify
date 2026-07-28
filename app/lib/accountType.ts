/**
 * Account identity resolution — the single place the database's
 * `users.user_type` is turned into what the app uses.
 *
 * THE THREE-FIELD SPLIT (see DECISIONS.md):
 *   accountType  — DB truth. 'enterprise' or one of the marketplace types.
 *                  This is the only value that may ever be written back to
 *                  the database, and the only one a server-side gate trusts.
 *   userType     — DERIVED marketplace persona. An enterprise account
 *                  resolves to 'buyer', which is what gives it full
 *                  marketplace access (discovery, orders, sourcing) and
 *                  keeps every Record<UserType, …> config map valid with
 *                  exactly its ten existing keys.
 *   isEnterprise — DERIVED capability flag, true only when the DATABASE
 *                  says 'enterprise'. Enterprise gating checks this, never
 *                  `position` (see the md_ceo note below).
 *
 * ONE-WAY HYDRATION — DO NOT WRITE `userType` BACK TO THE DATABASE.
 * For an enterprise account `userType` is deliberately 'buyer'. Persisting
 * it to users.user_type would silently downgrade a real enterprise account
 * to a plain buyer. Write `accountType` and nothing else.
 *
 * WHY NOT `position`: the Position union (solo_founder, md_ceo, …) and
 * EnterprisePosition overlap on 'md_ceo' and 'head_operations', so a solo
 * brand founder who picked "MD / CEO" is indistinguishable from an
 * enterprise CEO by position alone. Position answers "which role inside an
 * enterprise", never "is this an enterprise".
 */

import type { UserType } from "../context/UserContext";

export const ENTERPRISE_ACCOUNT_TYPE = "enterprise";

// The value stored in users.user_type.
export type AccountType = UserType | typeof ENTERPRISE_ACCOUNT_TYPE;

// Written as a Record so TypeScript fails the build if a new UserType is
// added to the union without being listed here.
const MARKETPLACE_TYPES: Record<UserType, true> = {
  buyer: true,
  manufacturer: true,
  fabric_mill: true,
  trim_supplier: true,
  artisan: true,
  job_worker: true,
  designer: true,
  master: true,
  merchandiser: true,
  qc_inspector: true,
};

// The marketplace persona an enterprise account acts as. Enterprise is
// additive: full buyer-side marketplace access PLUS the /enterprise/*
// workspace, never a replacement for it.
const ENTERPRISE_MARKETPLACE_PERSONA: UserType = "buyer";

const DEFAULT_MARKETPLACE_PERSONA: UserType = "buyer";

export function isMarketplaceType(value: unknown): value is UserType {
  return typeof value === "string" && value in MARKETPLACE_TYPES;
}

// Server-safe: takes the raw users.user_type column value. This is the
// check any server-side enterprise gate should use.
export function isEnterpriseAccount(rawUserType: unknown): boolean {
  return rawUserType === ENTERPRISE_ACCOUNT_TYPE;
}

export interface ResolvedAccount {
  accountType: AccountType;
  userType: UserType;
  isEnterprise: boolean;
}

// Turns the raw DB value into the three fields the app uses. Unknown or
// missing values fall back to the buyer persona, matching the previous
// default behaviour.
export function resolveAccount(rawUserType: unknown): ResolvedAccount {
  if (isEnterpriseAccount(rawUserType)) {
    return {
      accountType: ENTERPRISE_ACCOUNT_TYPE,
      userType: ENTERPRISE_MARKETPLACE_PERSONA,
      isEnterprise: true,
    };
  }

  if (isMarketplaceType(rawUserType)) {
    return { accountType: rawUserType, userType: rawUserType, isEnterprise: false };
  }

  return {
    accountType: DEFAULT_MARKETPLACE_PERSONA,
    userType: DEFAULT_MARKETPLACE_PERSONA,
    isEnterprise: false,
  };
}
