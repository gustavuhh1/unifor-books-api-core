import type { FastifyInstance } from "fastify";
import { authenticate } from "../../shared/middlewares/authenticate";
import { authorize } from "../../shared/middlewares/authorize";
import * as FinesSchema from "./fines.schema";
import { listarMultas, minhasMultas, quitarMulta, pagarMulta } from "./fines.service";

export async function finesRoutes(app: FastifyInstance) {
  // Listar todas as multas (Admin)
  app.get(
    "/multas",
    {
      schema: {
        tags: ["Multas"],
        security: [{ bearerAuth: [] }],
        response: FinesSchema.listarMultasResponseSchema,
      },
      preHandler: [authenticate, authorize("ADMIN")],
    },
    async (_, reply) => {
      try {
        const result = await listarMultas();
        return reply.code(200).send(result);
      } catch (error: any) {
        return reply.code(400).send({ message: "Erro ao listar multas" });
      }
    },
  );

  // Listar minhas multas (Aluno)
  app.get(
    "/multas/minhas",
    {
      schema: {
        tags: ["Multas"],
        security: [{ bearerAuth: [] }],
        response: FinesSchema.listarMultasResponseSchema,
      },
      preHandler: [authenticate],
    },
    async (request, reply) => {
      try {
        const usuarioId = request.user.id;
        const result = await minhasMultas(usuarioId);
        return reply.code(200).send(result);
      } catch (error: any) {
        return reply.code(400).send({ message: "Erro ao buscar multas" });
      }
    },
  );

  // Quitar multa administrativamente no balcão (Admin)
  app.patch(
    "/multas/:id/quitar",
    {
      schema: {
        tags: ["Multas"],
        security: [{ bearerAuth: [] }],
        response: FinesSchema.acaoMultaResponseSchema,
      },
      preHandler: [authenticate, authorize("ADMIN")],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const result = await quitarMulta(id);
        return reply.code(200).send(result);
      } catch (error: any) {
        return reply.code(400).send({ message: error.message || "Erro ao quitar multa" });
      }
    },
  );

  // Pagar multa pelo aplicativo (Aluno - Simulado V1)
  app.patch(
    "/multas/:id/pagar",
    {
      schema: {
        tags: ["Multas"],
        security: [{ bearerAuth: [] }],
        response: FinesSchema.acaoMultaResponseSchema,
      },
      preHandler: [authenticate],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const usuarioId = request.user.id;
        const result = await pagarMulta(usuarioId, id);
        return reply.code(200).send(result);
      } catch (error: any) {
        return reply.code(400).send({ message: error.message || "Erro ao pagar multa" });
      }
    },
  );
}
