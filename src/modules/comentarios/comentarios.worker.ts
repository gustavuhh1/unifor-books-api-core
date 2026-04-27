import type { ConsumeMessage } from "amqplib";
import { getRabbitChannel } from "../../shared/rabbitmq/connection.js";
import { prisma } from "../../database/prisma.js";

export async function startComentariosWorker() {
  const channel = getRabbitChannel();
  if (!channel) {
    console.error("RabbitMQ channel not found. Cannot start Comentarios Worker.");
    return;
  }

  const comentariosQueue = "fila.comentarios";
  const likesQueue = "fila.likes";

  // Consume comments
  await channel.consume(comentariosQueue, async (msg: ConsumeMessage | null) => {
    if (msg !== null) {
      try {
        const payload = JSON.parse(msg.content.toString());
        const { usuarioId, livroId, parentId, conteudo } = payload;

        await prisma.comentario.create({
          data: {
            usuarioId,
            livroId,
            parentId: parentId || null,
            conteudo,
          },
        });

        console.log(`[Worker] Comentário salvo para o livro ${livroId}`);
        channel.ack(msg);
      } catch (error) {
        console.error("[Worker] Erro ao processar comentário:", error);
        channel.nack(msg, false, false);
      }
    }
  });

  // Consume likes
  await channel.consume(likesQueue, async (msg: ConsumeMessage | null) => {
    if (msg !== null) {
      try {
        const payload = JSON.parse(msg.content.toString());
        const { usuarioId, comentarioId } = payload;

        // Check if already liked to prevent unique constraint error
        const existing = await prisma.comentarioLike.findUnique({
          where: {
            usuarioId_comentarioId: {
              usuarioId,
              comentarioId,
            },
          },
        });

        if (existing) {
          // If already liked, unlike it
          await prisma.comentarioLike.delete({
            where: {
              id: existing.id,
            },
          });
          console.log(`[Worker] Like removido do comentário ${comentarioId}`);
        } else {
          await prisma.comentarioLike.create({
            data: {
              usuarioId,
              comentarioId,
            },
          });
          console.log(`[Worker] Like adicionado ao comentário ${comentarioId}`);
        }

        channel.ack(msg);
      } catch (error) {
        console.error("[Worker] Erro ao processar like:", error);
        channel.nack(msg, false, false);
      }
    }
  });

  console.log("👷 Workers de comentários e likes iniciados com sucesso!");
}
