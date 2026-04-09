import type { FastifyInstance } from "fastify";
import { login, refresh, logout } from "./auth.service";
import {
  loginBodySchema,
  loginResponseSchema,
  logoutBodySchema,
  logoutResponseSchema,
  refreshBodySchema,
  refreshResponseSchema,
} from "./auth.scheme";

export async function authRoutes(app: FastifyInstance) {
  app.post(
    "/auth/login",
    {
      schema: {
        body: loginBodySchema,
        response: loginResponseSchema,
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
        body: refreshBodySchema,
        response: refreshResponseSchema,
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
        body: logoutBodySchema,
        response: logoutResponseSchema,
      },
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
