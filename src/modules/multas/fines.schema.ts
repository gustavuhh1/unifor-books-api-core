export const multaSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    emprestimoId: { type: "string" },
    usuarioId: { type: "string" },
    valorTotal: { type: "number" },
    diasAtraso: { type: "number" },
    status: { type: "string" },
    dataPagamento: { type: "string", format: "date-time", nullable: true },
    criadoEm: { type: "string", format: "date-time" },
  },
} as const;

export const listarMultasResponseSchema = {
  200: {
    type: "object",
    properties: {
      multas: { type: "array", items: multaSchema },
    },
  },
  400: {
    type: "object",
    properties: {
      message: { type: "string" },
    },
  },
} as const;

export const acaoMultaResponseSchema = {
  200: {
    type: "object",
    properties: {
      message: { type: "string" },
      multa: multaSchema,
    },
  },
  400: {
    type: "object",
    properties: {
      message: { type: "string" },
    },
  },
} as const;
