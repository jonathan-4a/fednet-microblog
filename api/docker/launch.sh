#!/usr/bin/env bash
# ==============================================================================
#  microblog — Federation Network Launcher
# ==============================================================================
#  Generates docker-compose.yml, nginx.conf, and /etc/hosts entries for N
#  independent microblog instances, each with its own identity and database.
#
#  Usage:
#    ./launch.sh <N>              Generate config files for N instances
#    ./launch.sh <N> --start      Generate + build image + start all containers
#    ./launch.sh --clear          Stop containers and clean up all managed config
#
#  Examples:
#    ./launch.sh 10               Prepare 10-instance network config
#    ./launch.sh 50 --start       Launch a 50-node federation network
#    ./launch.sh --clear          Tear everything down cleanly
# ==============================================================================

set -euo pipefail

# ── Constants ─────────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DOCKER_DIR="$SCRIPT_DIR"
COMPOSE_FILE="$DOCKER_DIR/docker-compose.yml"
NGINX_FILE="$DOCKER_DIR/nginx.conf"
HOSTS_TAG="# managed:microblog-fednet"
IMAGE_NAME="microblog-built:latest"

# ── Colors ────────────────────────────────────────────────────────────────────

RESET="\033[0m"
BOLD="\033[1m"
DIM="\033[2m"
GREEN="\033[32m"
BLUE="\033[34m"
CYAN="\033[36m"
YELLOW="\033[33m"
RED="\033[31m"
WHITE="\033[97m"

# ── Helpers ───────────────────────────────────────────────────────────────────

print_banner() {
  echo ""
  echo -e "${BOLD}${BLUE}╔══════════════════════════════════════════════════╗${RESET}"
  echo -e "${BOLD}${BLUE}║${WHITE}        microblog · Federation Network            ${BLUE}║${RESET}"
  echo -e "${BOLD}${BLUE}╚══════════════════════════════════════════════════╝${RESET}"
  echo ""
}

step() {
  echo -e "${BOLD}${CYAN}  →  ${WHITE}$1${RESET}"
}

success() {
  echo -e "${GREEN}  ✔  ${WHITE}$1${RESET}"
}

warn() {
  echo -e "${YELLOW}  ⚠  $1${RESET}"
}

fail() {
  echo -e "${RED}  ✖  $1${RESET}"
  exit 1
}

divider() {
  echo -e "${DIM}  ────────────────────────────────────────────────${RESET}"
}

usage() {
  print_banner
  echo -e "${BOLD}  Usage:${RESET}"
  echo -e "  ${CYAN}./launch.sh${RESET} ${WHITE}<N>${RESET}              Generate config for N instances"
  echo -e "  ${CYAN}./launch.sh${RESET} ${WHITE}<N> --start${RESET}      Generate + build + start all containers"
  echo -e "  ${CYAN}./launch.sh${RESET} ${WHITE}--clear${RESET}          Stop containers and remove all managed config"
  echo ""
  exit 0
}

# ── Argument Parsing ──────────────────────────────────────────────────────────

N=0
START=false
CLEAR=false

for arg in "$@"; do
  case "$arg" in
    --start) START=true ;;
    --clear) CLEAR=true ;;
    --help|-h) usage ;;
    [0-9]*) N="$arg" ;;
    *) fail "Unknown argument: $arg" ;;
  esac
done

# ── Clear Mode ────────────────────────────────────────────────────────────────

if [[ "$CLEAR" == "true" ]]; then
  print_banner
  echo -e "${BOLD}  Clearing federation network...${RESET}"
  echo ""
  divider
  echo ""

  step "Stopping and removing containers..."
  cd "$DOCKER_DIR"
  docker compose down --remove-orphans --volumes 2>/dev/null \
    && success "Containers stopped and removed" \
    || warn "No containers were running"

  step "Removing generated docker-compose.yml..."
  rm -f "$COMPOSE_FILE" \
    && success "docker-compose.yml removed" \
    || warn "No docker-compose.yml found"

  step "Removing generated nginx.conf..."
  rm -f "$NGINX_FILE" \
    && success "nginx.conf removed" \
    || warn "No nginx.conf found"

  step "Cleaning /etc/hosts entries..."
  sudo sed -i '' "/$HOSTS_TAG/d" /etc/hosts \
    && success "/etc/hosts cleaned" \
    || warn "No managed entries found"

  echo ""
  divider
  echo ""
  echo -e "${GREEN}${BOLD}  ✔  Cleared successfully.${RESET}"
  echo ""
  exit 0
fi

# ── Validate N ────────────────────────────────────────────────────────────────

if ! [[ "$N" =~ ^[0-9]+$ ]] || [[ "$N" -lt 1 ]]; then
  fail "Please provide a valid number of instances.\n     Usage: ./launch.sh <N> [--start]"
fi

# ── Banner ────────────────────────────────────────────────────────────────────

print_banner
echo -e "  ${DIM}Instances   ${RESET}${BOLD}${WHITE}$N${RESET}"
echo -e "  ${DIM}Mode        ${RESET}${BOLD}${WHITE}$( [[ "$START" == "true" ]] && echo "generate + build + start" || echo "generate config only" )${RESET}"
echo -e "  ${DIM}Output      ${RESET}${BOLD}${WHITE}$DOCKER_DIR${RESET}"
echo ""
divider
echo ""

# ── Step 1: docker-compose.yml ────────────────────────────────────────────────

step "Generating docker-compose.yml..."

cat > "$COMPOSE_FILE" << EOF
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
EOF

for i in $(seq 1 $N); do
  echo "      - instance$i" >> "$COMPOSE_FILE"
done

cat >> "$COMPOSE_FILE" << EOF

  instance1:
    build:
      context: ..
      dockerfile: docker/Dockerfile
    image: $IMAGE_NAME
    environment:
      - NODE_ENV=production
      - PORT=80
      - DOMAIN=instance1
      - PROTOCOL=http
      - DB_PATH=/app/data/node1.db
      - JWT_SECRET=change-me-in-production
      - ADMIN_USER=admin1
      - ADMIN_PASS=admin123
    volumes:
      - ./data/instance1:/app/data
    command: bun run dist/server.js
EOF

for i in $(seq 2 $N); do
cat >> "$COMPOSE_FILE" << EOF

  instance$i:
    image: $IMAGE_NAME
    pull_policy: never
    environment:
      - NODE_ENV=production
      - PORT=80
      - DOMAIN=instance$i
      - PROTOCOL=http
      - DB_PATH=/app/data/node$i.db
      - JWT_SECRET=change-me-in-production
      - ADMIN_USER=admin$i
      - ADMIN_PASS=admin123
    volumes:
      - ./data/instance$i:/app/data
    command: bun run dist/server.js
EOF
done

success "docker-compose.yml  ($N services)"

# ── Step 2: nginx.conf ────────────────────────────────────────────────────────

step "Generating nginx.conf..."

cat > "$NGINX_FILE" << 'EOF'
events {
    worker_connections 1024;
}
http {
EOF

for i in $(seq 1 $N); do
cat >> "$NGINX_FILE" << EOF
    upstream instance$i {
        server instance$i:80;
        keepalive 8;
    }
EOF
done

cat >> "$NGINX_FILE" << EOF

    server {
        listen 80 default_server;
        server_name _;
        location / {
            proxy_pass http://instance1;
            proxy_http_version 1.1;
            proxy_set_header Connection "";
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_connect_timeout 10s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }
    }
EOF

for i in $(seq 1 $N); do
cat >> "$NGINX_FILE" << EOF

    server {
        listen 80;
        server_name instance$i;
        location / {
            proxy_pass http://instance$i;
            proxy_http_version 1.1;
            proxy_set_header Connection "";
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_connect_timeout 10s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }
    }
EOF
done

echo "}" >> "$NGINX_FILE"

success "nginx.conf          ($N server blocks)"

# ── Step 3: /etc/hosts ────────────────────────────────────────────────────────

step "Updating /etc/hosts  (sudo required)..."

sudo sed -i '' "/$HOSTS_TAG/d" /etc/hosts

for i in $(seq 1 $N); do
  echo "127.0.0.1 instance$i $HOSTS_TAG" | sudo tee -a /etc/hosts > /dev/null
done

success "/etc/hosts          ($N entries added)"

# ── Step 4: Build & Start ─────────────────────────────────────────────────────

if [[ "$START" == "true" ]]; then
  echo ""
  divider
  echo ""

  step "Stopping existing containers..."
  cd "$DOCKER_DIR"
  docker compose down --remove-orphans 2>/dev/null || true
  success "Stopped"

  echo ""
  step "Building image  →  ${IMAGE_NAME}..."
  echo ""
  docker compose build instance1
  echo ""
  success "Image built successfully"

  echo ""
  step "Starting $N instances..."
  echo ""
  docker compose up -d
  echo ""
  success "All containers started"
fi

# ── Summary ───────────────────────────────────────────────────────────────────

echo ""
divider
echo ""

if [[ "$START" == "true" ]]; then
  echo -e "${GREEN}${BOLD}  ✔  Federation network is live — $N nodes running${RESET}"
  echo ""
  echo -e "${BOLD}  Nodes:${RESET}"
  for i in $(seq 1 $N); do
    echo -e "  ${DIM}$(printf '%3d' $i).${RESET}  ${CYAN}http://instance$i${RESET}"
  done
  echo ""
  echo -e "  ${DIM}To tear down:  ${CYAN}./launch.sh --clear${RESET}"
else
  echo -e "${GREEN}${BOLD}  ✔  Config generated for $N instances${RESET}"
  echo ""
  echo -e "  ${DIM}To start:      ${CYAN}./launch.sh $N --start${RESET}"
  echo -e "  ${DIM}To tear down:  ${CYAN}./launch.sh --clear${RESET}"
fi

echo ""