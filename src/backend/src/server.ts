// Server Entry Point
// Simplified DDD: Application bootstrap

import { buildApp } from './app.js';
import { config } from './shared/config/index.js';

async function main() {
  const app = await buildApp();

  try {
    const address = await app.listen({
      port: config.server.port,
      host: config.server.host,
    });
    app.log.info(`🚀 VentroPos API running at ${address}`);
    app.log.info(`📚 API Documentation: ${address}/docs`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
