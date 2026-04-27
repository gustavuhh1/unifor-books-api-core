export const avaliarLivroBodySchema = {
  type: "object",
  required: ["nota"],
  properties: {
    nota: { type: "number", minimum: 1, maximum: 5 },
    texto: { type: "string", maxLength: 1000 },
  },
} as const;

export const avaliarLivroResponseSchema = {
  200: {
    type: "object",
    properties: {
      id: { type: "string" },
      nota: { type: "number" },
      texto: { type: "string", nullable: true },
      criadoEm: { type: "string" },
      livro: {
        type: "object",
        properties: {
          id: { type: "string" },
          titulo: { type: "string" },
        },
      },
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

export const removerAvaliacaoBodySchema = {
  type: "object",
} as const;

export const removerAvaliacaoResponseSchema = {
  200: {
    type: "object",
    properties: {
      message: { type: "string" },
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
