import "dotenv/config";
import app from "./app";
import { connectRabbitMQ, closeRabbitMQ } from "./shared/rabbitmq/connection.js";
import { startComentariosWorker } from "./modules/comentarios/comentarios.worker.js";

const PORT = Number(process.env.PORT) || 3333;

async function start() {
  try {
    await connectRabbitMQ();
    await startComentariosWorker();

    await app.listen({ port: PORT, host: "0.0.0.0" });
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

// ─── Shutdown gracioso ────────────────────────────────────────────────────────
async function shutdown(signal: string) {
  console.log(`\n⚙️  Sinal recebido: ${signal}. Encerrando servidor...`);
  await app.close();
  await closeRabbitMQ();
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

start();
