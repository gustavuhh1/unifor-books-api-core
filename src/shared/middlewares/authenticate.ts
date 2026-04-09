import type { FastifyReply, FastifyRequest } from "fastify";
import { verifyAccessToken } from "../../utils/jwt";

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return reply.code(401).send({ message: "Token não fornecido" });
  }

  const token = authHeader.split(" ")[1];

  try {

    if(!token) {
      return reply.code(401).send({ message: "Token não fornecido" });
    }

    const payload = await verifyAccessToken(token);
    request.user = {
      id: payload.sub,
      matricula: payload.matricula,
      role: payload.role,
    };
  } catch {
    return reply.code(401).send({ message: "Token inválido ou expirado" });
  }
}
