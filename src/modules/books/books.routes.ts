import type { FastifyInstance } from "fastify";
import {
  listarLivros,
  buscarLivroPorId,
  criarLivro,
  editarLivro,
  adicionarExemplar,
} from "./books.service";
import * as BooksSchema from "./books.schema";
import { authenticate } from "../../shared/middlewares/authenticate";
import { authorize } from "../../shared/middlewares/authorize";

export async function booksRoutes(app: FastifyInstance) {
  app.get(
    "/books",
    {
      schema: {
        tags: ["Books"],
        querystring: BooksSchema.listarLivrosQuerySchema,
        response: BooksSchema.listarLivrosResponseSchema,
      },
      preHandler: [authenticate],
    },
    async (request, reply) => {
      const query = request.query as {
        titulo?: string;
        autor?: string;
        categoria?: string;
        orderBy?: "avaliacao" | "titulo" | "criadoEm";
        page?: number;
        limit?: number;
      };

      try {
        const result = await listarLivros(query);
        return reply.code(200).send(result);
      } catch (error) {
        return reply.code(500).send({ message: "Erro ao listar livros" });
      }
    },
  );

  app.get(
    "/books/:id",
    {
      schema: {
        tags: ["Books"],
        response: BooksSchema.buscarLivroPorIdResponseSchema,
      },
      preHandler: [authenticate],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      try {
        const result = await buscarLivroPorId(id);
        return reply.code(200).send(result);
      } catch (error) {
        return reply.code(404).send({ message: "Livro não encontrado" });
      }
    },
  );

  app.post(
    "/books",
    {
      schema: {
        tags: ["Books"],
        body: BooksSchema.criarLivroBodySchema,
        response: BooksSchema.criarLivroResponseSchema,
      },
      preHandler: [authenticate, authorize("ADMIN")],
    },
    async (request, reply) => {
      const data = request.body as {
        titulo: string;
        autor: string;
        isbn: string;
        sinopse?: string;
        capaUrl?: string;
        categoria: string;
      };

      try {
        const result = await criarLivro(data);
        return reply.code(201).send(result);
      } catch (error) {
        return reply.code(409).send({ message: "Já existe um livro com esse ISBN" });
      }
    },
  );

  app.put(
    "/books/:id",
    {
      schema: {
        tags: ["Books"],
        body: BooksSchema.editarLivroBodySchema,
        response: BooksSchema.editarLivroResponseSchema,
      },
      preHandler: [authenticate, authorize("ADMIN")],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const data = request.body as {
        titulo?: string;
        autor?: string;
        sinopse?: string;
        capaUrl?: string;
        categoria?: string;
      };

      try {
        const result = await editarLivro(id, data);
        return reply.code(200).send(result);
      } catch (error) {
        return reply.code(404).send({ message: "Livro não encontrado" });
      }
    },
  );

  app.post(
    "/books/:id/exemplares",
    {
      schema: {
        tags: ["Books"],
        body: BooksSchema.adicionarExemplarBodySchema,
        response: BooksSchema.adicionarExemplarResponseSchema,
      },
      preHandler: [authenticate, authorize("ADMIN")],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const { numeroTombo } = request.body as { numeroTombo: string };

      try {
        const result = await adicionarExemplar(id, numeroTombo);
        return reply.code(201).send(result);
      } catch (error) {
        return reply.code(409).send({ message: "Número de tombo já cadastrado" });
      }
    },
  );
}
