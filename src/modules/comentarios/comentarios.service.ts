import { prisma } from "../../database/prisma.js";
import { getRabbitChannel, QUEUES } from "../../shared/rabbitmq/connection.js";

// ─── Produtor: Comentário ─────────────────────────────────────────────────────
export async function publicarComentario(payload: {
  usuarioId: string;
  livroId: string;
  conteudo: string;
  parentId?: string;
}) {
  // Valida se o livro existe e está ativo
  const livro = await prisma.livro.findUnique({
    where: { id: payload.livroId },
    select: { id: true, ativo: true },
  });

  if (!livro || !livro.ativo) {
    throw new Error("Livro não encontrado.");
  }

  // Se for resposta (parentId), valida se o comentário pai existe
  if (payload.parentId) {
    const pai = await prisma.comentario.findUnique({
      where: { id: payload.parentId },
      select: { id: true, deletado: true },
    });

    if (!pai || pai.deletado) {
      throw new Error("Comentário pai não encontrado ou foi removido.");
    }
  }

  const channel = getRabbitChannel();
  const mensagem = Buffer.from(JSON.stringify(payload));

  channel.sendToQueue(QUEUES.COMENTARIOS, mensagem, { persistent: true });
}

// ─── Produtor: Like ───────────────────────────────────────────────────────────
export async function publicarLike(payload: {
  usuarioId: string;
  comentarioId: string;
}) {
  // Valida se o comentário existe e não foi deletado
  const comentario = await prisma.comentario.findUnique({
    where: { id: payload.comentarioId },
    select: { id: true, deletado: true },
  });

  if (!comentario || comentario.deletado) {
    throw new Error("Comentário não encontrado ou foi removido.");
  }

  const channel = getRabbitChannel();
  const mensagem = Buffer.from(JSON.stringify(payload));

  channel.sendToQueue(QUEUES.LIKES, mensagem, { persistent: true });
}

export async function listarComentarios(livroId: string) {
  const comentarios = await prisma.comentario.findMany({
    where: { livroId },
    include: {
      usuario: true,
      parent: true,
      respostas: true,
    },
  });

  return comentarios;
}
