import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server as SocketIOServer } from 'socket.io';
import { SocketIOManager } from './src/lib/socketio-manager';

const port = parseInt(process.env.PORT || '3000', 10);
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Créer le serveur HTTP
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  // Créer le serveur Socket.IO
  const io = new SocketIOServer(server, {
    path: '/ws/chat',
    cors: {
      origin: dev ? 'http://localhost:3000' : process.env.NEXTAUTH_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Initialiser le gestionnaire Socket.IO
  const socketManager = new SocketIOManager(io);

  console.log('🚀 Socket.IO Server initialized on /ws/chat');

  // Démarrer le serveur
  server.listen(port, () => {
    console.log(
      `> Server listening at http://localhost:${port} as ${
        dev ? 'development' : process.env.NODE_ENV
      }`
    );
    console.log(`> Socket.IO server ready at http://localhost:${port}/ws/chat`);
  });

  // Gérer l'arrêt gracieux
  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    socketManager.shutdown();
    server.close(() => {
      console.log('HTTP server closed');
    });
  });
});
