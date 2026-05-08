import type { FastifyInstance } from "fastify";
import { login, refresh, logout } from "./auth.service";
import * as authSchema from "./auth.scheme";
import { authenticate } from "@/shared/middlewares/authenticate";

export async function authRoutes(app: FastifyInstance) {
  app.post(
    "/auth/login",
    {
      schema: {
        tags: ["Auth"],
        body: authSchema.loginBodySchema,
        response: authSchema.loginResponseSchema,
      },
    },
    async (request, reply) => {
      const { matricula, senha } = request.body as {
        matricula: string;
        senha: string;
      };

      try {
        const result = await login(matricula, senha);
        return reply.code(200).send(result);
      } catch (error) {
        return reply.code(401).send({ message: "Credenciais inválidas" });
      }
    },
  );

  app.post(
    "/auth/refresh",
    {
      schema: {
        tags: ["Auth"],
        body: authSchema.refreshBodySchema,
        response: authSchema.refreshResponseSchema,
      },
    },
    async (request, reply) => {
      const { refreshToken } = request.body as {
        refreshToken: string;
      };

      try {
        const result = await refresh(refreshToken);
        return reply.code(200).send(result);
      } catch (error) {
        return reply.code(401).send({ message: "Sessão inválida ou expirada" });
      }
    },
  );

  app.post(
    "/auth/logout",
    {
      schema: {
        tags: ["Auth"],
        security: [{ bearerAuth: [] }],
        body: authSchema.logoutBodySchema,
        response: authSchema.logoutResponseSchema,
      },
      preHandler: [authenticate]
    },
    async (request, reply) => {
      const { refreshToken } = request.body as {
        refreshToken: string;
      };

      await logout(refreshToken);
      return reply.code(200).send({ message: "Logout realizado com sucesso" });
    },
  );
}
