#!/bin/bash
# =============================================================================
# Start Jitsi Meet self-hosted services for LearnUp Platform
# =============================================================================
# Usage:
#   ./scripts/start-jitsi.sh [start|stop|restart|logs|status|setup]
# =============================================================================

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
JITSI_DIR="${PROJECT_ROOT}/infrastructure/jitsi"
ENV_FILE="${JITSI_DIR}/.env.jitsi"
ENV_EXAMPLE="${JITSI_DIR}/.env.jitsi"
COMPOSE_FILE="${JITSI_DIR}/docker-compose.jitsi.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

info() {
    echo -e "${CYAN}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

get_local_ip() {
    # Try different methods to get local IP
    if command -v hostname &> /dev/null; then
        hostname -I 2>/dev/null | awk '{print $1}' && return
    fi
    if command -v ifconfig &> /dev/null; then
        ifconfig | grep 'inet ' | grep -v '127.0.0.1' | awk '{print $2}' | head -1 && return
    fi
    if command -v ip &> /dev/null; then
        ip route get 1 | awk '{print $7}' | head -1 && return
    fi
    echo "127.0.0.1"
}

setup() {
    info "Setting up Jitsi environment..."

    if [ ! -f "$ENV_FILE" ]; then
        info "Creating .env.jitsi from template..."
        cp "$ENV_EXAMPLE" "$ENV_FILE"

        # Get local IP and update the env file
        LOCAL_IP=$(get_local_ip)
        if [ "$LOCAL_IP" != "127.0.0.1" ]; then
            info "Detected local IP: $LOCAL_IP"
            sed -i "s/DOCKER_HOST_ADDRESS=127.0.0.1/DOCKER_HOST_ADDRESS=$LOCAL_IP/" "$ENV_FILE" 2>/dev/null || \
                sed -i '' "s/DOCKER_HOST_ADDRESS=127.0.0.1/DOCKER_HOST_ADDRESS=$LOCAL_IP/" "$ENV_FILE"
            success "Updated DOCKER_HOST_ADDRESS to $LOCAL_IP"
        fi
    else
        info ".env.jitsi already exists"
    fi

    # Create config directories
    CONFIG_DIRS=(
        "config/web"
        "config/web/crontabs"
        "config/transcripts"
        "config/prosody/config"
        "config/prosody/prosody-plugins-custom"
        "config/jicofo"
        "config/jvb"
    )

    for dir in "${CONFIG_DIRS[@]}"; do
        FULL_PATH="${JITSI_DIR}/${dir}"
        if [ ! -d "$FULL_PATH" ]; then
            mkdir -p "$FULL_PATH"
            info "Created directory: $dir"
        fi
    done

    success "Jitsi environment setup complete!"
}

start_jitsi() {
    info "Starting Jitsi Meet services..."

    # Ensure network exists
    docker network create learnup-network 2>/dev/null || true

    # Start services
    cd "$PROJECT_ROOT"
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d

    success "Jitsi Meet services started!"
    echo ""
    info "Access Jitsi Meet at: http://localhost:8443"
    info "To create a meeting, navigate to: http://localhost:8443/YourRoomName"
}

stop_jitsi() {
    info "Stopping Jitsi Meet services..."
    cd "$PROJECT_ROOT"
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down
    success "Jitsi Meet services stopped!"
}

restart_jitsi() {
    stop_jitsi
    sleep 2
    start_jitsi
}

show_logs() {
    info "Showing Jitsi Meet logs (Ctrl+C to exit)..."
    cd "$PROJECT_ROOT"
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" logs -f
}

show_status() {
    info "Jitsi Meet services status:"
    cd "$PROJECT_ROOT"
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps
}

# Main execution
ACTION="${1:-start}"

case "$ACTION" in
    setup)
        setup
        ;;
    start)
        setup
        start_jitsi
        ;;
    stop)
        stop_jitsi
        ;;
    restart)
        restart_jitsi
        ;;
    logs)
        show_logs
        ;;
    status)
        show_status
        ;;
    *)
        echo "Usage: $0 [start|stop|restart|logs|status|setup]"
        exit 1
        ;;
esac
