import type { FastifyInstance } from "fastify";
import { criarUsuarioSchema, type CriarUsuarioInput } from "./users.schema.js";
import { criarUsuario, listarUsuarios } from "./users.service.js";
import { prisma } from "@prisma/prisma.js";
import { authenticate } from "@/shared/middlewares/authenticate.js";
import { authorize } from "@/shared/middlewares/authorize.js";

export async function usersRoutes(app: FastifyInstance) {
  app.post<{ Body: CriarUsuarioInput }>("/users", async (request, reply) => {
    const body = criarUsuarioSchema.parse(request.body);

    const usuario = await criarUsuario(body);

    return reply.status(201).send(usuario);
  });

  app.get(
    "/users",
    { preHandler: [authenticate, authorize("ADMIN")] },
    async (request, reply) => {
      // auth route (apenas admin pode acessar)

      const users = await listarUsuarios();

      return reply.send({ message: "Listar usuários", users: users });
    },
  );
}
