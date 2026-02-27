#!/usr/bin/env bash
#
# Integration tests: shared, auth, users, admin, logout.
# Logical flow: register → login (user + admin) → use APIs with tokens → logout → verify blacklisted token rejected.
#
# Usage:
#   BASE_URL=http://localhost:3000 ./tests/integration/test_endpoints.sh
#   BASE_URL=http://localhost:3000 ADMIN_USER=admin ADMIN_PASS=admin123 ./tests/integration/test_endpoints.sh
#
# For full run including admin routes, set ADMIN_USER and ADMIN_PASS.
#
set -uo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
API_BASE="${BASE_URL%/}/api"
ADMIN_BASE="${API_BASE}/admin"

TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

HAS_JQ=0
command -v jq >/dev/null 2>&1 && HAS_JQ=1

TEST_USERNAME="testuser_$(date +%s)_$$"
TEST_PASSWORD="TestPass123!"
USER_TOKEN=""
ADMIN_TOKEN=""
LAST_STATUS=""
LAST_BODY_FILE=""

make_request() {
  local method="$1" url="$2" body="${3:-}" token="${4:-}"
  LAST_BODY_FILE="${TMP_DIR}/r${TOTAL_TESTS}.json"
  local args=(-s -o "$LAST_BODY_FILE" -w "%{http_code}" -X "$method" -H "Content-Type: application/json")
  [[ -n "$token" ]] && args+=(-H "Authorization: Bearer $token")
  [[ -n "$body" ]] && args+=(-d "$body")
  LAST_STATUS="$(curl "${args[@]}" "$url" 2>/dev/null || echo "000")"
}

json_get() {
  [[ "$HAS_JQ" -eq 1 && -f "$LAST_BODY_FILE" ]] && jq -r "$1 // \"${2:-}\"" "$LAST_BODY_FILE" 2>/dev/null || echo "${2:-}"
}

test_endpoint() {
  local expected="$1" method="$2" endpoint="$3" range="${4:-}"
  ((TOTAL_TESTS++))
  if [[ -n "$range" ]]; then
    if [[ "$LAST_STATUS" -ge "${expected%xx}" && "$LAST_STATUS" -le "${expected%xx}9" ]]; then
      echo "PASS: $method $endpoint -> $LAST_STATUS"
      ((PASSED_TESTS++))
      return 0
    fi
  elif [[ "$LAST_STATUS" == "$expected" ]]; then
    echo "PASS: $method $endpoint -> $LAST_STATUS"
    ((PASSED_TESTS++))
    return 0
  fi
  local err="$(json_get '.message // .error // .msg' '')"
  echo "FAIL: $method $endpoint -> expected $expected, got $LAST_STATUS${err:+ | $err}"
  ((FAILED_TESTS++))
  return 1
}

validate_json() {
  local path="$1" expected="$2" description="$3"
  ((TOTAL_TESTS++))
  local actual="$(json_get "$path" '')"
  if [[ "$actual" == "$expected" ]]; then
    echo "  PASS: $description"
    ((PASSED_TESTS++))
    return 0
  else
    echo "  FAIL: $description - expected '$expected', got '$actual'"
    ((FAILED_TESTS++))
    return 1
  fi
}

skip_reason() {
  local n="${1:-1}"
  local reason="${2:-skipped}"
  echo "SKIP: $reason"
  for ((i=0;i<n;i++)); do ((TOTAL_TESTS++)); done
}

echo "=============================================="
echo "  Integration tests: Auth, Users, Admin"
echo "=============================================="
echo "BASE_URL: $BASE_URL"
echo "Test user: $TEST_USERNAME"
echo "Admin: ${ADMIN_USER:-<not set>}"
echo ""

# ------------------------------------------------------------------------------
# 1. Shared (no auth)
# ------------------------------------------------------------------------------
echo "--- 1. Shared ---"
make_request GET "${API_BASE}/health"
test_endpoint 200 GET "/api/health"
validate_json '.status' 'ok' "health status ok"

make_request GET "${API_BASE}/config"
test_endpoint 200 GET "/api/config"

make_request GET "${API_BASE}/docs"
test_endpoint 200 GET "/api/docs"

make_request GET "${API_BASE}/docs/openapi.json"
test_endpoint 200 GET "/api/docs/openapi.json"

make_request GET "${API_BASE}/nonexistent"
test_endpoint 404 GET "/api/nonexistent" "4xx"

# ------------------------------------------------------------------------------
# 2. Auth: Register
# ------------------------------------------------------------------------------
echo ""
echo "--- 2. Auth: Register ---"
make_request POST "${API_BASE}/auth/register" '{"password":"TestPass123!"}'
test_endpoint 400 POST "/api/auth/register" "4xx"

make_request POST "${API_BASE}/auth/register" "{\"username\":\"${TEST_USERNAME}\"}"
test_endpoint 400 POST "/api/auth/register" "4xx"

make_request POST "${API_BASE}/auth/register" '{"username":"","password":"TestPass123!"}'
test_endpoint 400 POST "/api/auth/register" "4xx"

make_request POST "${API_BASE}/auth/register" "{\"username\":\"x\",\"password\":\"TestPass123!\"}"
test_endpoint 400 POST "/api/auth/register" "4xx"

make_request POST "${API_BASE}/auth/register" '{"username":"test","password":}'
test_endpoint 400 POST "/api/auth/register" "4xx"

make_request POST "${API_BASE}/auth/register" "{\"username\":\"${TEST_USERNAME}\",\"password\":\"${TEST_PASSWORD}\",\"displayName\":\"Test User\",\"summary\":\"Test summary\"}"
if test_endpoint 201 POST "/api/auth/register"; then
  validate_json '.success' 'true' "register success true"
fi

make_request POST "${API_BASE}/auth/register" "{\"username\":\"${TEST_USERNAME}\",\"password\":\"${TEST_PASSWORD}\"}"
test_endpoint 409 POST "/api/auth/register" "4xx"

make_request POST "${API_BASE}/auth/register" "{\"username\":\"inv_$$_$(date +%s)\",\"password\":\"TestPass123!\",\"inviteToken\":\"invalid\"}"
test_endpoint 201 POST "/api/auth/register"

# ------------------------------------------------------------------------------
# 3. Auth: Login (regular user) — must succeed for rest of test
# ------------------------------------------------------------------------------
echo ""
echo "--- 3. Auth: Login (user) ---"
make_request POST "${API_BASE}/auth/login" '{"password":"TestPass123!"}'
test_endpoint 400 POST "/api/auth/login" "4xx"

make_request POST "${API_BASE}/auth/login" '{"username":"nonexistent_x","password":"TestPass123!"}'
test_endpoint 401 POST "/api/auth/login" "4xx"

make_request POST "${API_BASE}/auth/login" "{\"username\":\"${TEST_USERNAME}\",\"password\":\"WrongPass1!\"}"
test_endpoint 401 POST "/api/auth/login" "4xx"

make_request POST "${API_BASE}/auth/login" "{\"username\":\"${TEST_USERNAME}\",\"password\":\"${TEST_PASSWORD}\"}"
if ! test_endpoint 200 POST "/api/auth/login"; then
  echo "  CRITICAL: User login failed; cannot test users section."
fi
USER_TOKEN="$(json_get '.token' '')"
if [[ -n "$USER_TOKEN" && "$USER_TOKEN" != "null" ]]; then
  validate_json '.user.username' "$TEST_USERNAME" "login response username"
  validate_json '.user.displayName' 'Test User' "login response displayName"
fi

# ------------------------------------------------------------------------------
# 4. Auth: Login (admin) — optional
# ------------------------------------------------------------------------------
echo ""
echo "--- 4. Auth: Login (admin) ---"
if [[ -n "${ADMIN_USER:-}" && -n "${ADMIN_PASS:-}" ]]; then
  make_request POST "${API_BASE}/auth/login" "{\"username\":\"${ADMIN_USER}\",\"password\":\"${ADMIN_PASS}\"}"
  if test_endpoint 200 POST "/api/auth/login"; then
    ADMIN_TOKEN="$(json_get '.token' '')"
    if [[ -n "$ADMIN_TOKEN" && "$ADMIN_TOKEN" != "null" ]]; then
      validate_json '.user.isAdmin' 'true' "admin login isAdmin true"
    fi
  fi
else
  skip_reason 2 "ADMIN_USER/ADMIN_PASS not set"
fi

# ------------------------------------------------------------------------------
# 5. Users (as regular user)
# ------------------------------------------------------------------------------
echo ""
echo "--- 5. Users (with user token) ---"
make_request GET "${API_BASE}/users/me"
test_endpoint 401 GET "/api/users/me" "4xx"

make_request GET "${API_BASE}/users/search"
test_endpoint 401 GET "/api/users/search" "4xx"

if [[ -n "$USER_TOKEN" ]]; then
  make_request GET "${API_BASE}/users/me" "" "$USER_TOKEN"
  if test_endpoint 200 GET "/api/users/me"; then
    validate_json '.username' "$TEST_USERNAME" "me username"
    validate_json '.displayName' 'Test User' "me displayName"
  fi

  make_request GET "${API_BASE}/users/search?q=testuser" "" "$USER_TOKEN"
  test_endpoint 200 GET "/api/users/search?q=testuser"

  make_request GET "${API_BASE}/users/search?q=no_match_xyz" "" "$USER_TOKEN"
  test_endpoint 200 GET "/api/users/search?q=no_match"
else
  skip_reason 5 "no user token"
fi

# ------------------------------------------------------------------------------
# 6. Admin (as admin) — only if ADMIN_TOKEN set
# ------------------------------------------------------------------------------
echo ""
echo "--- 6. Admin (with admin token) ---"
make_request GET "${ADMIN_BASE}/dashboard"
test_endpoint 401 GET "/api/admin/dashboard" "4xx"

if [[ -n "$ADMIN_TOKEN" ]]; then
  make_request GET "${ADMIN_BASE}/dashboard" "" "$ADMIN_TOKEN"
  test_endpoint 200 GET "/api/admin/dashboard"

  make_request GET "${ADMIN_BASE}/users" "" "$ADMIN_TOKEN"
  test_endpoint 200 GET "/api/admin/users"

  make_request GET "${ADMIN_BASE}/users/${TEST_USERNAME}" "" "$ADMIN_TOKEN"
  if test_endpoint 200 GET "/api/admin/users/:id"; then
    validate_json '.user.username' "$TEST_USERNAME" "admin get user username"
  fi

  make_request GET "${ADMIN_BASE}/settings" "" "$ADMIN_TOKEN"
  test_endpoint 200 GET "/api/admin/settings"

  make_request GET "${ADMIN_BASE}/invites" "" "$ADMIN_TOKEN"
  test_endpoint 200 GET "/api/admin/invites"

  make_request GET "${ADMIN_BASE}/posts" "" "$ADMIN_TOKEN"
  test_endpoint 200 GET "/api/admin/posts"
else
  skip_reason 7 "no admin token"
fi

# ------------------------------------------------------------------------------
# 7. Logout and blacklisted-token behaviour
# ------------------------------------------------------------------------------
echo ""
echo "--- 7. Logout ---"
make_request POST "${API_BASE}/auth/logout"
test_endpoint 401 POST "/api/auth/logout" "4xx"

LAST_BODY_FILE="${TMP_DIR}/logout_no_header.json"
LAST_STATUS="$(curl -s -o "$LAST_BODY_FILE" -w "%{http_code}" -X POST -H "Authorization: Bearer invalid" "${API_BASE}/auth/logout" 2>/dev/null || echo "000")"
test_endpoint 401 POST "/api/auth/logout (invalid token)" "4xx"

if [[ -n "$USER_TOKEN" ]]; then
  make_request POST "${API_BASE}/auth/logout" "" "$USER_TOKEN"
  if test_endpoint 200 POST "/api/auth/logout"; then
    validate_json '.msg' 'Logged out successfully' "logout message"
  fi

  make_request POST "${API_BASE}/auth/logout" "" "$USER_TOKEN"
  test_endpoint 401 POST "/api/auth/logout (same token again)" "4xx"

  make_request GET "${API_BASE}/users/me" "" "$USER_TOKEN"
  test_endpoint 401 GET "/api/users/me (blacklisted token)" "4xx"
else
  skip_reason 3 "no user token for logout"
fi

# ------------------------------------------------------------------------------
# Summary
# ------------------------------------------------------------------------------
echo ""
echo "=============================================="
echo "  Summary"
echo "=============================================="
echo "Total: $TOTAL_TESTS | Passed: $PASSED_TESTS | Failed: $FAILED_TESTS"
[[ $FAILED_TESTS -eq 0 ]] && exit 0 || exit 1

