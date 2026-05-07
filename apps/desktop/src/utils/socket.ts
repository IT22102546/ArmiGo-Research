import { io } from 'socket.io-client';

// In dev VITE_API_URL is '' (proxy only handles HTTP, not WebSocket)
// Always connect to the real API for WebSocket
const SOCKET_URL = import.meta.env.VITE_API_URL || 'https://api.armigorehab.com';

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ['websocket', 'polling'],
});
