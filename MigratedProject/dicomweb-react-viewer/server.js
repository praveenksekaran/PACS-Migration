import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const apiUrl = process.env.API_URL || 'http://localhost:5001';
const port = parseInt(process.env.PORT || '3000', 10);

const server = Fastify({ logger: true });

server.register(fastifyCors, {});

// Security headers required for SharedArrayBuffer (MPR/VTK.js web workers)
server.register(fastifyHelmet, {
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: { policy: 'require-corp' },
  crossOriginResourcePolicy: { policy: 'same-site' },
  crossOriginOpenerPolicy: { policy: 'same-origin' },
});

// Serve app-config.js dynamically — API URL comes from API_URL env var
server.get('/app-config.js', (_req, reply) => {
  reply.header('Content-Type', 'application/javascript');
  reply.send(`window.config = {\n  apiUrl: '${apiUrl}',\n};\n`);
});

// Serve pre-built React app from dist/
server.register(fastifyStatic, {
  root: join(__dirname, 'dist'),
});

// SPA fallback — all unmatched routes return index.html
server.setNotFoundHandler((_req, reply) => {
  reply.sendFile('index.html');
});

server.listen({ port, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`viewer listening on ${address}`);
  console.log(`api url: ${apiUrl}`);
});
