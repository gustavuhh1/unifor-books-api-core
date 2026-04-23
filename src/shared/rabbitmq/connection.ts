import amqplib, { type ChannelModel, type Channel } from "amqplib";

export const QUEUES = {
  COMENTARIOS: "fila.comentarios",
  LIKES: "fila.likes",
} as const;

let connection: ChannelModel | null = null;
let channel: Channel | null = null;

export async function connectRabbitMQ(): Promise<void> {
  const url = process.env.RABBITMQ_URL ?? "";
  const devMode = process.env.NODE_ENV === "development";

  // Conexão com o RabbitMQ
  connection = await amqplib.connect(url);
  channel = await connection.createChannel();

  // Inserção das filas no RabbitMQ
  for (const queue of Object.values(QUEUES)) {
    await channel.assertQueue(queue, { durable: true });
    devMode && console.log(`📬 Fila declarada: ${queue}`);
  }

  devMode && console.log("🐇 Conexão com RabbitMQ (CloudAMQP) estabelecida.");

  connection.on("error", (err: Error) => {
    console.error("❌ RabbitMQ connection error:", err.message);
    connection = null;
    channel = null;
  });

  connection.on("close", () => {
    console.warn("⚠️ RabbitMQ connection closed.");
    connection = null;
    channel = null;
  });
}

export function getRabbitChannel(): Channel {
  if (!channel) {
    throw new Error("RabbitMQ channel is not available.");
  }
  return channel;
}

export async function closeRabbitMQ(): Promise<void> {
  try {
    await channel?.close();
    await connection?.close();
  } catch {
    // Silently ignore errors during shutdown
  }
}
