const server = require('fastify')({
  logger: false,
});
const fastifyCors = require('@fastify/cors');
const fastifySensible = require('@fastify/sensible');
const fastifyHelmet = require('@fastify/helmet');
const fastifyAutoload = require('@fastify/autoload');
const closeWithGrace = require('close-with-grace');

const config = require('config');
const path = require('path');
const utils = require('./utils');

const logger = utils.getLogger();

// Allow requests from the viewer (cross-origin)
server.register(fastifyCors, {
  origin: config.get('viewerOrigin'),
});
server.register(fastifySensible);
server.register(fastifyHelmet, {
  contentSecurityPolicy: false,
});

server.register(fastifyAutoload, {
  dir: path.join(__dirname, 'routes'),
});

server.setErrorHandler(async (err) => {
  logger.error(err.message);
});

// log exceptions
process.on('uncaughtException', (err) => {
  logger.error('uncaught exception received:');
  logger.error(err.stack);
});

//------------------------------------------------------------------
closeWithGrace({ delay: 500 }, async ({ signal, err, manual }) => {
  if (err) {
    logger.error(err);
  }
  logger.info('shutting down...', signal, manual);
  try {
    await server.close();
  } catch (error) {
    logger.error(error);
  }
});

//------------------------------------------------------------------

const port = config.get('apiPort');
logger.info('starting...');
server.listen({ port, host: '0.0.0.0' }, async (err, address) => {
  if (err) {
    await logger.error(err, address);
    process.exit(1);
  }
  logger.info(`api-server listening on port: ${port}`);
});

//------------------------------------------------------------------
