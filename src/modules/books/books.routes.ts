import type { FastifyInstance } from "fastify";
import {
  listarLivros,
  buscarLivroPorId,
  criarLivro,
  editarLivro,
  adicionarExemplar,
  atualizarStatusExemplar,
  desativarLivro,
  deletarExemplar,
  atualizarExemplar,
} from "./books.service";
import * as BooksSchema from "./books.schema";
import { authenticate } from "../../shared/middlewares/authenticate";
import { authorize } from "../../shared/middlewares/authorize";

export async function booksRoutes(app: FastifyInstance) {
  // Listar livros com busca, paginação e ordenação
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

  // Buscar livro por ID
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

  // Criar livro
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
        anoPublicacao?: number;
        editora?: string;
        idioma?: string;
        paginas?: number;
      };

      try {
        const result = await criarLivro(data);
        return reply.code(201).send(result);
      } catch (error) {
        return reply.code(409).send({ message: "Já existe um livro com esse ISBN" });
      }
    },
  );

  // Editar livro
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
        anoPublicacao?: number;
        editora?: string;
        idioma?: string;
        paginas?: number;
        ativo?: boolean;
      };

      try {
        const result = await editarLivro(id, data);
        return reply.code(200).send(result);
      } catch (error) {
        return reply.code(404).send({ message: "Livro não encontrado" });
      }
    },
  );

  // Adicionar exemplar
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

  // Atualizar status de um exemplar
  app.patch(
    "/books/exemplares/:exemplarId/status",
    {
      schema: {
        tags: ["Books"],
        body: BooksSchema.atualizarExemplarBodySchema,
        response: BooksSchema.atualizarExemplarResponseSchema,
      },
      preHandler: [authenticate, authorize("ADMIN")],
    },
    async (request, reply) => {
      const { exemplarId } = request.params as { exemplarId: string };
      const { status } = request.body as { status: "DISPONIVEL" | "EMPRESTADO" | "INDISPONIVEL" };

      try {
        const result = await atualizarStatusExemplar(exemplarId, status);
        return reply.code(200).send(result);
      } catch (error) {
        return reply.code(404).send({ message: "Exemplar não encontrado" });
      }
    },
  );

  // Atualizar número de tombo de um exemplar
  app.patch("/books/exemplares/:exemplarId", {
    schema: {
      tags: ["Books"],
    },
    preHandler: [authenticate, authorize("ADMIN")],
  }, async (request, reply) => {
    const { exemplarId } = request.params as { exemplarId: string };
    const { numeroTombo } = request.body as { numeroTombo: string };

    try {
      const result = await atualizarExemplar(exemplarId, numeroTombo);
      return reply.code(200).send(result);
    } catch (error) {
      return reply.code(404).send({ message: "Exemplar não encontrado" });
    }
  });

  // Desativar livro
  app.delete(
    "/books/:id",
    {
      schema: {
        tags: ["Books"],
        response: BooksSchema.editarLivroResponseSchema, // Reaproveita o schema do livro
      },
      preHandler: [authenticate, authorize("ADMIN")],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      try {
        const result = await desativarLivro(id);
        return reply.code(200).send(result);
      } catch (error) {
        return reply.code(404).send({ message: "Livro não encontrado" });
      }
    },
  );

  // Deletar exemplar
  app.delete(
    "/books/:id/exemplares/:exemplarId",
    {
      schema: {
        tags: ["Books"],
        response: BooksSchema.deletarExemplarResponseSchema,
      },
      preHandler: [authenticate, authorize("ADMIN")],
    },
    async (request, reply) => {
      const { exemplarId } = request.params as { exemplarId: string };

      try {
        const result = await deletarExemplar(exemplarId);
        return reply.code(200).send(result);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao deletar exemplar";
        if (message.includes("não encontrado")) {
          return reply.code(404).send({ message });
        }
        return reply.code(409).send({ message });
      }
    },
  );
}
