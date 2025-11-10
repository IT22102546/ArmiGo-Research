# Self-Hosted Jitsi Meet Setup Guide

This guide explains how to set up and run a self-hosted Jitsi Meet instance for the LearnUp Platform.

## Overview

The LearnUp Platform uses Jitsi Meet for video conferencing. This self-hosted setup includes:

- **Jitsi Web** - The web interface for Jitsi Meet
- **Prosody** - XMPP server for messaging and presence
- **Jicofo** - Conference focus component that manages conferences
- **JVB** - Video Bridge for routing video streams

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- At least 4GB of available RAM
- Ports 8443, 8444, and 10000/UDP available

### Start Jitsi

**Windows (PowerShell):**

```powershell
cd c:\Users\thava\Desktop\test\learnup-platform
.\scripts\start-jitsi.ps1 start
```

**Linux/macOS:**

```bash
cd /path/to/learnup-platform

# Create network if it doesn't exist
docker network create learnup-network 2>/dev/null || true

# Copy and configure environment
cp infrastructure/jitsi/.env.jitsi.example infrastructure/jitsi/.env.jitsi

# Start Jitsi services
docker-compose -f infrastructure/jitsi/docker-compose.jitsi.yml \
  --env-file infrastructure/jitsi/.env.jitsi up -d
```

### Access Jitsi

Once started, access Jitsi Meet at:

- **Local Development:** http://localhost:8443
- **Create a Room:** http://localhost:8443/MyRoomName

## Configuration

### Environment Variables

The main configuration file is `infrastructure/jitsi/.env.jitsi`. Copy from the example:

```bash
cp infrastructure/jitsi/.env.jitsi.example infrastructure/jitsi/.env.jitsi
```

Key settings:

| Variable                | Description                 | Default               |
| ----------------------- | --------------------------- | --------------------- |
| `JITSI_HTTP_PORT`       | HTTP port for Jitsi Web     | 8443                  |
| `JITSI_HTTPS_PORT`      | HTTPS port for Jitsi Web    | 8444                  |
| `PUBLIC_URL`            | Public URL for Jitsi        | http://localhost:8443 |
| `DOCKER_HOST_ADDRESS`   | Your machine's IP for media | 127.0.0.1             |
| `ENABLE_AUTH`           | Require authentication      | false                 |
| `ENABLE_GUESTS`         | Allow guest access          | true                  |
| `ENABLE_LOBBY`          | Enable waiting room         | true                  |
| `ENABLE_BREAKOUT_ROOMS` | Enable breakout rooms       | true                  |

### Critical: DOCKER_HOST_ADDRESS

For video/audio to work correctly, `DOCKER_HOST_ADDRESS` must be set to your machine's actual IP address (not localhost or 127.0.0.1).

**Find your IP:**

Windows:

```powershell
ipconfig | Select-String "IPv4"
```

Linux/macOS:

```bash
hostname -I | awk '{print $1}'
# or
ifconfig | grep 'inet ' | grep -v 127.0.0.1 | awk '{print $2}'
```

Update the `.env.jitsi` file:

```env
DOCKER_HOST_ADDRESS=192.168.1.100  # Use your actual IP
```

### Backend Configuration

The backend is already configured to connect to your self-hosted Jitsi instance.

In `apps/backend/.env`:

```env
# Point to your self-hosted Jitsi
JITSI_DOMAIN=localhost:8443

# JWT auth disabled for self-hosted
JITSI_USE_JWT=false
JITSI_APP_ID=
JITSI_API_SECRET=
```

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     LearnUp Platform                          │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│   ┌─────────────┐       ┌─────────────┐                      │
│   │   Frontend  │◄─────►│   Backend   │                      │
│   │  (Next.js)  │       │  (NestJS)   │                      │
│   └──────┬──────┘       └──────┬──────┘                      │
│          │                     │                              │
│          │ IFrame              │ Session                     │
│          │ Embed               │ Management                  │
│          ▼                     ▼                              │
│   ┌──────────────────────────────────────────────────────┐   │
│   │              Self-Hosted Jitsi Meet                   │   │
│   │  ┌────────────────────────────────────────────────┐  │   │
│   │  │              Jitsi Web (:8443)                  │  │   │
│   │  │         Web interface & config                  │  │   │
│   │  └───────────────────┬────────────────────────────┘  │   │
│   │                      │                                │   │
│   │  ┌───────────────────┼────────────────────────────┐  │   │
│   │  │                   ▼                             │  │   │
│   │  │  ┌─────────┐  ┌─────────┐  ┌─────────────────┐ │  │   │
│   │  │  │ Prosody │◄►│ Jicofo  │◄►│ JVB (Video      │ │  │   │
│   │  │  │ (XMPP)  │  │ (Focus) │  │ Bridge :10000)  │ │  │   │
│   │  │  └─────────┘  └─────────┘  └─────────────────┘ │  │   │
│   │  │           XMPP Communication Layer              │  │   │
│   │  └─────────────────────────────────────────────────┘  │   │
│   └──────────────────────────────────────────────────────┘   │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

## Commands

### Using PowerShell Script (Windows)

```powershell
# Start all Jitsi services
.\scripts\start-jitsi.ps1 start

# Stop all services
.\scripts\start-jitsi.ps1 stop

# Restart services
.\scripts\start-jitsi.ps1 restart

# View logs
.\scripts\start-jitsi.ps1 logs

# Check status
.\scripts\start-jitsi.ps1 status

# Setup only (create env and directories)
.\scripts\start-jitsi.ps1 setup
```

### Using Docker Compose Directly

```bash
# Navigate to project root
cd learnup-platform

# Start
docker-compose -f infrastructure/jitsi/docker-compose.jitsi.yml \
  --env-file infrastructure/jitsi/.env.jitsi up -d

# Stop
docker-compose -f infrastructure/jitsi/docker-compose.jitsi.yml \
  --env-file infrastructure/jitsi/.env.jitsi down

# Logs
docker-compose -f infrastructure/jitsi/docker-compose.jitsi.yml \
  --env-file infrastructure/jitsi/.env.jitsi logs -f

# Status
docker-compose -f infrastructure/jitsi/docker-compose.jitsi.yml \
  --env-file infrastructure/jitsi/.env.jitsi ps
```

## Integrating with the Application

### Frontend Usage

The frontend `JitsiMeetFrame` component automatically connects to the configured Jitsi domain:

```tsx
import { JitsiMeetFrame } from "@/app/video-conferencing/JitsiMeetFrame";

function VideoSession({ roomId, displayName }) {
  return (
    <JitsiMeetFrame
      roomName={roomId}
      displayName={displayName}
      jitsiDomain="localhost:8443" // or from env
      onClose={() => console.log("Meeting ended")}
    />
  );
}
```

### Backend Usage

The backend video service manages session creation:

```typescript
// Create a session
const session = await videoService.createSession({
  roomName: "my-meeting",
  userId: "user-123",
});

// Returns:
// {
//   roomName: 'my-meeting',
//   jitsiDomain: 'localhost:8443',
//   jitsiToken: null,  // null for self-hosted without auth
//   displayName: 'User Name',
//   isModerator: true
// }
```

## Troubleshooting

### Video/Audio Not Working

1. **Check DOCKER_HOST_ADDRESS**: Must be your actual network IP, not 127.0.0.1
2. **Firewall**: Ensure UDP port 10000 is open
3. **Check JVB logs**: `docker logs learnup-jitsi-jvb`

### Cannot Connect to Meeting

1. **Verify services are running**: `docker ps | grep jitsi`
2. **Check Prosody logs**: `docker logs learnup-jitsi-xmpp`
3. **Verify network**: `docker network inspect learnup-network`

### "Meeting not available" Error

1. **Check Jicofo**: `docker logs learnup-jitsi-jicofo`
2. **Restart services**: `.\scripts\start-jitsi.ps1 restart`

### Services Won't Start

1. **Check ports**: Ensure 8443, 8444, 10000/UDP are available
2. **Check Docker memory**: Jitsi needs at least 2GB RAM
3. **Check logs**: `docker-compose -f infrastructure/jitsi/docker-compose.jitsi.yml logs`

## Production Deployment

For production, make these changes:

### 1. Enable HTTPS

```env
DISABLE_HTTPS=false
PUBLIC_URL=https://jitsi.yourdomain.com
```

### 2. Use Strong Passwords

Generate secure passwords:

```bash
openssl rand -hex 32
```

Update in `.env.jitsi`:

```env
JICOFO_AUTH_PASSWORD=<generated>
JICOFO_COMPONENT_SECRET=<generated>
JVB_AUTH_PASSWORD=<generated>
```

### 3. Enable Authentication (Optional)

```env
ENABLE_AUTH=true
ENABLE_GUESTS=false
```

### 4. Configure Reverse Proxy (nginx)

Add to your nginx config:

```nginx
server {
    listen 443 ssl http2;
    server_name jitsi.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:8443;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 5. Update Backend Configuration

```env
JITSI_DOMAIN=jitsi.yourdomain.com
```

## Resources

- [Jitsi Meet Documentation](https://jitsi.github.io/handbook/)
- [Jitsi Docker Repository](https://github.com/jitsi/docker-jitsi-meet)
- [Jitsi Community Forum](https://community.jitsi.org/)
