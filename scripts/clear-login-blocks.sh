#!/usr/bin/env bash
# Clear every anti-spray block (chunk 2.10).
#
# ⚠️ SAFE TO RUN ANY TIME. otp_requests is a throttle COUNTER, not an audit log
# — these rows only decide "may this address try again". Deleting them cannot
# touch an account, a credential or a session. Rows expire on their own after
# 48h, and any single block clears itself after 15 minutes.
#
# Use this if you block the address you are testing from: the check runs BEFORE
# the password verify, so you cannot log in to clear your own rows.
set -euo pipefail
cd "$(dirname "$0")/.."
URL=$(grep '^NEXT_PUBLIC_SUPABASE_URL=' .env.local | cut -d= -f2- | tr -d '\r')
KEY=$(grep '^SUPABASE_SERVICE_ROLE_KEY=' .env.local | cut -d= -f2- | tr -d '\r')
before=$(curl -s "$URL/rest/v1/otp_requests?purpose=eq.login-fail&select=id" \
  -H "apikey: $KEY" -H "Authorization: Bearer $KEY" | grep -o '"id"' | wc -l | tr -d ' ')
curl -s -X DELETE "$URL/rest/v1/otp_requests?purpose=eq.login-fail" \
  -H "apikey: $KEY" -H "Authorization: Bearer $KEY" -o /dev/null -w "" 
echo "cleared $before login-fail row(s) — every anti-spray block is lifted"
