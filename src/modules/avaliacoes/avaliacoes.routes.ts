import type { FastifyInstance } from "fastify";
import { avaliarLivro, removerAvaliacao } from "./avaliacoes.service.js";
import * as AvaliacoesSchema from "./avaliacoes.schema.js";
import { authenticate } from "../../shared/middlewares/authenticate.js";

export async function avaliacoesRoutes(app: FastifyInstance) {
  app.post(
    "/books/:id/ratings",
    {
      schema: {
        tags: ["Engajamento"],
        body: AvaliacoesSchema.avaliarLivroBodySchema,
        response: AvaliacoesSchema.avaliarLivroResponseSchema,
        security: [{ bearerAuth: [] }],
      },
      preHandler: [authenticate],
    },
    async (request, reply) => {
      const { id: livroId } = request.params as { id: string };
      const { nota, texto } = request.body as { nota: number; texto?: string };
      const usuarioId = (request as any).user.id as string;

      try {
        const result = await avaliarLivro(usuarioId, livroId, nota, texto);
        return reply.code(200).send(result);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Erro ao registrar avaliação";

        if (message.includes("não encontrado")) {
          return reply.code(404).send({ message });
        }
        return reply.code(400).send({ message });
      }
    },
  );

  app.delete(
    "/books/:id/ratings",
    {
      schema: {
        tags: ["Engajamento"],
        body: AvaliacoesSchema.removerAvaliacaoBodySchema,
        response: AvaliacoesSchema.removerAvaliacaoResponseSchema,
        security: [{ bearerAuth: [] }],
      },
      preHandler: [authenticate],
    },
    async (request, reply) => {
      const { id: livroId } = request.params as { id: string };
      const usuarioId = (request as any).user.id as string;

      try {
        const result = await removerAvaliacao(usuarioId, livroId);
        return reply.code(200).send(result);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Erro ao remover avaliação";

        if (message.includes("não encontrado")) {
          return reply.code(404).send({ message });
        }
        return reply.code(400).send({ message });
      }
    },
  );
}
