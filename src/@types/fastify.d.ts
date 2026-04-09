import "fastify";

declare module "fastify" {
  interface FastifyRequest {
    user?: {
      id: string;
      matricula: string;
      role: string;
    };
  }
}
