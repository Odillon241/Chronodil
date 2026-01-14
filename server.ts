import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server as SocketIOServer } from 'socket.io';
import { SocketIOManager } from './src/lib/socketio-manager';
import { createServerClient } from '@supabase/ssr';
import type { IncomingMessage, ServerResponse } from 'http';

const port = parseInt(process.env.PORT || '3000', 10);
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

/**
 * Protection auth Supabase pour les routes /dashboard
 * Remplace le proxy.ts qui ne fonctionne pas avec les serveurs custom
 */
async function checkAuth(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = req.url || '';
  const pathname = parse(url).pathname || '';

  // Skip auth check pour les assets et API routes
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/auth/') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp)$/)
  ) {
    return true; // Allow request
  }

  // Vérifier l'authentification pour /dashboard
  if (pathname.startsWith('/dashboard')) {
    try {
      // Parse cookies from request
      const cookieHeader = req.headers.cookie || '';
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);

      // Créer le client Supabase
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return Object.entries(cookies).map(([name, value]) => ({ name, value }));
            },
            setAll() {
              // No-op in custom server
            },
          },
        }
      );

      // Vérifier la session utilisateur
      const { data: { user }, error } = await supabase.auth.getUser();

      if (!user || error) {
        // Rediriger vers la page de login
        const redirectUrl = `/auth/login?redirectTo=${encodeURIComponent(pathname)}`;
        res.writeHead(307, { Location: redirectUrl });
        res.end();
        return false; // Block request
      }
    } catch (error) {
      console.error('[Auth] Error checking authentication:', error);
      res.writeHead(307, { Location: '/auth/login' });
      res.end();
      return false;
    }
  }

  return true; // Allow request
}

app.prepare().then(() => {
  // Créer le serveur HTTP avec protection auth
  const server = createServer(async (req, res) => {
    // Vérifier l'authentification AVANT de traiter la requête
    const isAllowed = await checkAuth(req, res);
    if (!isAllowed) {
      return; // Response déjà envoyée (redirect)
    }

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
