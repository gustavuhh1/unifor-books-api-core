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
