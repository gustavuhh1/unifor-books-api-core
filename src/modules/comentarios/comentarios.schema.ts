// ─── POST /books/:id/comments ─────────────────────────────────────────────────

export const criarComentarioBodySchema = {
  type: "object",
  required: ["conteudo"],
  properties: {
    conteudo: { type: "string", minLength: 1, maxLength: 2000 },
    parentId: { type: "string", description: "ID do comentário pai (resposta)" },
  },
} as const;

export const criarComentarioResponseSchema = {
  202: {
    type: "object",
    properties: {
      message: { type: "string" },
      queued: { type: "boolean" },
    },
  },
  400: {
    type: "object",
    properties: { message: { type: "string" } },
  },
  404: {
    type: "object",
    properties: { message: { type: "string" } },
  },
} as const;

// ─── POST /comments/:id/likes ─────────────────────────────────────────────────

export const likeComentarioResponseSchema = {
  202: {
    type: "object",
    properties: {
      message: { type: "string" },
      queued: { type: "boolean" },
    },
  },
  404: {
    type: "object",
    properties: { message: { type: "string" } },
  },
} as const;

// ─── GET /books/:id/comments ─────────────────────────────────────────────────

export const listarComentariosResponseSchema = {
  200: {
    type: "array",
    items: {
      type: "object",
      properties: {
        id: { type: "string" },
        usuarioId: { type: "string" },
        livroId: { type: "string" },
        parentId: { type: "string" },
        conteudo: { type: "string" },
        deletado: { type: "boolean" },
        criadoEm: { type: "string", format: "date-time" },
        atualizadoEm: { type: "string", format: "date-time" },
        usuario: {
          type: "object",
          properties: {
            id: { type: "string" },
            nome: { type: "string" },
            email: { type: "string" },
          },
        },
        parent: {
          type: "object",
          properties: {
            id: { type: "string" },
            usuarioId: { type: "string" },
            livroId: { type: "string" },
            conteudo: { type: "string" },
            criadoEm: { type: "string", format: "date-time" },
          },
        },
        respostas: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              usuarioId: { type: "string" },
              livroId: { type: "string" },
              parentId: { type: "string" },
              conteudo: { type: "string" },
              criadoEm: { type: "string", format: "date-time" },
            },
          },
        },
        likesCount: { type: "number" },
      },
    },
  },
  404: {
    type: "object",
    properties: { message: { type: "string" } },
  },
} as const;
