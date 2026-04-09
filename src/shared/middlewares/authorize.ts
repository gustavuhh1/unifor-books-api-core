import type { FastifyReply, FastifyRequest } from "fastify";

type Role = "ALUNO" | "ADMIN";

export function authorize(...roles: Role[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const role = request.user?.role;

    if (!role || !roles.includes(role as Role)) {
      return reply.code(403).send({ message: "Acesso não autorizado" });
    }
  };
}
