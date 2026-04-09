import type { FastifyInstance } from "fastify";
import { criarUsuarioSchema, type CriarUsuarioInput } from "./users.schema.js";
import { criarUsuario } from "./users.service.js";
import { prisma } from "@prisma/prisma.js";

export async function usersRoutes(app: FastifyInstance) {
  app.post<{ Body: CriarUsuarioInput }>("/users", async (request, reply) => {
    const body = criarUsuarioSchema.parse(request.body);

    const usuario = await criarUsuario(body);

    return reply.status(201).send(usuario);
  });

  app.get("/users", async (request, reply) => {
    // auth route (apenas admin pode acessar)

    const users = await prisma.usuario.findMany();

    return reply.send({ message: "Listar usuários", users: users });
  });
}
