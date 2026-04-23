import type { FastifyInstance, FastifyRequest } from "fastify";
import { authenticate } from "../../shared/middlewares/authenticate";
import { authorize } from "../../shared/middlewares/authorize";
import * as LoansSchema from "./loans.schema";
import { solicitar, aprovar, negar, devolver, renovar, meusEmprestimos, entregar, cancelar } from "./loans.service";

export async function loansRoutes(app: FastifyInstance) {
  // Solicitar empréstimo (Aluno)
  app.post(
    "/emprestimos/solicitar",
    {
      schema: {
        tags: ["Empréstimos"],
        security: [{ bearerAuth: [] }],
        body: LoansSchema.solicitarEmprestimoBodySchema,
        response: LoansSchema.solicitarEmprestimoResponseSchema,
      },
      preHandler: [authenticate],
    },
    async (request, reply) => {
      try {
        const { livroId } = request.body as { livroId: string };
        const usuarioId = request.user.sub;

        const result = await solicitar(usuarioId, livroId);

        if (result.status === "FILA") {
          return reply.code(202).send({ message: result.message, fila: result.fila });
        } 

        return reply.code(201).send({ message: result.message, emprestimo: result.emprestimo });
      } catch (error: any) {
        return reply.code(409).send({ message: error.message || "Erro ao solicitar empréstimo" });
      }
    },
  );

  // Renovar empréstimo (Aluno)
  app.post(
    "/emprestimos/:id/renovar",
    {
      schema: {
        tags: ["Empréstimos"],
        security: [{ bearerAuth: [] }],
        response: LoansSchema.acaoEmprestimoResponseSchema,
      },
      preHandler: [authenticate],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const usuarioId = request.user.sub;
        const result = await renovar(usuarioId, id);
        return reply.code(200).send(result);
      } catch (error: any) {
        return reply.code(400).send({ message: error.message || "Erro ao renovar empréstimo" });
      }
    },
  );

  // Ver meus empréstimos (Aluno)
  app.get(
    "/emprestimos/meus",
    {
      schema: {
        tags: ["Empréstimos"],
        security: [{ bearerAuth: [] }],
        response: LoansSchema.meusEmprestimosResponseSchema,
      },
      preHandler: [authenticate],
    },
    async (request, reply) => {
      try {
        const usuarioId = request.user.sub;
        const result = await meusEmprestimos(usuarioId);
        return reply.code(200).send(result);
      } catch (error: any) {
        return reply.code(400).send({ message: "Erro ao buscar empréstimos" });
      }
    },
  );

  // Aprovar empréstimo (Admin)
  app.patch(
    "/emprestimos/:id/aprovar",
    {
      schema: {
        tags: ["Empréstimos"],
        security: [{ bearerAuth: [] }],
        response: LoansSchema.acaoEmprestimoResponseSchema,
      },
      preHandler: [authenticate, authorize("ADMIN")],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const result = await aprovar(id);
        return reply.code(200).send(result);
      } catch (error: any) {
        return reply.code(400).send({ message: error.message || "Erro ao aprovar empréstimo" });
      }
    },
  );

  // Negar empréstimo (Admin)
  app.patch(
    "/emprestimos/:id/negar",
    {
      schema: {
        tags: ["Empréstimos"],
        security: [{ bearerAuth: [] }],
        body: LoansSchema.negarEmprestimoBodySchema,
        response: LoansSchema.acaoEmprestimoResponseSchema,
      },
      preHandler: [authenticate, authorize("ADMIN")],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const { motivoNegacao } = request.body as { motivoNegacao: string };
        const result = await negar(id, motivoNegacao);
        return reply.code(200).send(result);
      } catch (error: any) {
        return reply.code(400).send({ message: error.message || "Erro ao negar empréstimo" });
      }
    },
  );

  // Devolver empréstimo (Admin)
  app.patch(
    "/emprestimos/:id/devolver",
    {
      schema: {
        tags: ["Empréstimos"],
        security: [{ bearerAuth: [] }],
        response: LoansSchema.acaoEmprestimoResponseSchema,
      },
      preHandler: [authenticate, authorize("ADMIN")],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const result = await devolver(id);
        return reply.code(200).send(result);
      } catch (error: any) {
        return reply.code(400).send({ message: error.message || "Erro ao devolver empréstimo" });
      }
    },
  );

  // Entregar livro físico (Admin)
  app.patch(
    "/emprestimos/:id/entregar",
    {
      schema: {
        tags: ["Empréstimos"],
        security: [{ bearerAuth: [] }],
        response: LoansSchema.acaoEmprestimoResponseSchema,
      },
      preHandler: [authenticate, authorize("ADMIN")],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const result = await entregar(id);
        return reply.code(200).send(result);
      } catch (error: any) {
        return reply.code(400).send({ message: error.message || "Erro ao registrar entrega do livro" });
      }
    },
  );

  // Cancelar reserva não retirada (Admin)
  app.patch(
    "/emprestimos/:id/cancelar",
    {
      schema: {
        tags: ["Empréstimos"],
        security: [{ bearerAuth: [] }],
        response: LoansSchema.acaoEmprestimoResponseSchema,
      },
      preHandler: [authenticate, authorize("ADMIN")],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const result = await cancelar(id);
        return reply.code(200).send(result);
      } catch (error: any) {
        return reply.code(400).send({ message: error.message || "Erro ao cancelar reserva" });
      }
    },
  );
}
