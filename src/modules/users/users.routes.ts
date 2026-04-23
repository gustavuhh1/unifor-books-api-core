import type { FastifyInstance } from "fastify";
import { buscarUsuarioPorId, criarUsuario, listarUsuarios } from "./users.service";
import * as UsersSchema from "./users.schema";
import { authenticate } from "../../shared/middlewares/authenticate";
import { authorize } from "../../shared/middlewares/authorize";

export async function usersRoutes(app: FastifyInstance) {
  app.post(
    "/users",
    {
      schema: {
        tags: ["Users"],
        body: UsersSchema.criarUsuarioBodySchema,
        response: UsersSchema.criarUsuarioResponseSchema,
      },
    },
    async (request, reply) => {
      const data = request.body as {
        matricula: string;
        nome: string;
        email: string;
        senha: string;
        role?: "ALUNO" | "ADMIN";
      };

      try {
        const usuario = await criarUsuario(data);
        return reply.code(201).send(usuario);
      } catch (error) {
        return reply.code(409).send({ message: "Já existe um usuário com esse email ou matrícula" });
      }
    },
  );

  app.get(
    "/users",
    {
      schema: {
        tags: ["Users"],
        security: [{ bearerAuth: [] }],
        response: UsersSchema.listarUsuariosResponseSchema,
      },
      preHandler: [authenticate, authorize("ADMIN")],
    },
    async (request, reply) => {
      try {
        const users = await listarUsuarios();
        return reply.code(200).send({ users });
      } catch (error) {
        return reply.code(500).send({ message: "Erro ao listar usuários" });
      }
    },
  );

  app.get(
    "/users/:id",
    {
      schema: {
        tags: ["Users"],
        security: [{ bearerAuth: [] }],
        response: UsersSchema.buscarUsuarioPorIdResponseSchema,
      },
      preHandler: [authenticate, authorize("ADMIN")],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const user = await buscarUsuarioPorId(id);
        return reply.code(200).send({ user });
      } catch (error) {
        return reply.code(500).send({ message: "Erro ao buscar usuário" });
      }
    },
  );
}
