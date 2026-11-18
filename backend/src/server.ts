import { app } from "./app.js";
import { env } from "./config/env.js";
import { sequelize } from "./database/sequelize.js";
import "./database/models.js";
import { logger } from "./shared/logger/logger.js";

// El servidor solo abre el puerto después de validar la configuración y la
// conexión a PostgreSQL. Así un despliegue defectuoso falla rápido.
const start = async (): Promise<void> => {
  await sequelize.authenticate();
  const server = app.listen(env.PORT, () =>
    logger.info(`API escuchando en puerto ${env.PORT}`),
  );

  // PM2 y systemd envían SIGTERM durante un reinicio o despliegue.
  // Cerramos primero HTTP y luego PostgreSQL para no cortar requests activas.
  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`Recibida señal ${signal}; iniciando apagado controlado`);
    server.close(async () => {
      await sequelize.close();
      process.exit(0);
    });
  };

  process.once("SIGTERM", () => void shutdown("SIGTERM"));
  process.once("SIGINT", () => void shutdown("SIGINT"));
};
start().catch((error: unknown) => {
  logger.error({ error });
  process.exit(1);
});
