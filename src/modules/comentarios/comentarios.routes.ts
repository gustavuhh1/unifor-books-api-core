import type { FastifyInstance } from "fastify";
import { publicarComentario, publicarLike } from "./comentarios.service.js";
import * as ComentariosSchema from "./comentarios.schema.js";
import { authenticate } from "../../shared/middlewares/authenticate.js";

export async function comentariosRoutes(app: FastifyInstance) {
  // ─── POST /books/:id/comments ──────────────────────────────────────────────
  app.post(
    "/books/:id/comments",
    {
      schema: {
        tags: ["Engajamento"],
        body: ComentariosSchema.criarComentarioBodySchema,
        response: ComentariosSchema.criarComentarioResponseSchema,
      },
      preHandler: [authenticate],
    },
    async (request, reply) => {
      const { id: livroId } = request.params as { id: string };
      const { conteudo, parentId } = request.body as {
        conteudo: string;
        parentId?: string;
      };
      const usuarioId = (request as any).user.id as string;

      try {
        await publicarComentario({
          usuarioId,
          livroId,
          conteudo,
          ...(parentId !== undefined ? { parentId } : {}),
        });
        return reply.code(202).send({
          message:
            "Comentário recebido e enviado para processamento assíncrono.",
          queued: true,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Erro ao enviar comentário";

        if (message.includes("não encontrado")) {
          return reply.code(404).send({ message });
        }
        return reply.code(400).send({ message });
      }
    },
  );

  // ─── POST /comments/:id/likes ──────────────────────────────────────────────
  app.post(
    "/comments/:id/likes",
    {
      schema: {
        tags: ["Engajamento"],
        response: ComentariosSchema.likeComentarioResponseSchema,
      },
      preHandler: [authenticate],
    },
    async (request, reply) => {
      const { id: comentarioId } = request.params as { id: string };
      const usuarioId = (request as any).user.id as string;

      try {
        await publicarLike({ usuarioId, comentarioId });
        return reply.code(202).send({
          message: "Like recebido e enviado para processamento assíncrono.",
          queued: true,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Erro ao registrar like";

        if (message.includes("não encontrado")) {
          return reply.code(404).send({ message });
        }
        // Fallback genérico — retorna 404 pois o único erro esperado é "não encontrado"
        return reply.code(404).send({ message });
      }
    },
  );
}
