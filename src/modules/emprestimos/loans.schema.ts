export const solicitarEmprestimoBodySchema = {
  type: "object",
  required: ["livroId"],
  properties: {
    livroId: { type: "string" },
  },
} as const;

export const negarEmprestimoBodySchema = {
  type: "object",
  required: ["motivoNegacao"],
  properties: {
    motivoNegacao: { type: "string" },
  },
} as const;

export const emprestimoSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    usuarioId: { type: "string" },
    exemplarId: { type: "string" },
    status: { type: "string" },
    motivoNegacao: { type: "string", nullable: true },
    dataSolicitacao: { type: "string", format: "date-time" },
    dataAprovacao: { type: "string", format: "date-time", nullable: true },
    dataDevolucaoPrevista: { type: "string", format: "date-time", nullable: true },
    dataDevolucaoReal: { type: "string", format: "date-time", nullable: true },
  },
} as const;

export const filaEsperaSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    usuarioId: { type: "string" },
    livroId: { type: "string" },
    posicao: { type: "number" },
    status: { type: "string" },
  },
} as const;

export const solicitarEmprestimoResponseSchema = {
  201: {
    type: "object",
    properties: {
      message: { type: "string" },
      emprestimo: emprestimoSchema,
    },
  },
  202: {
    type: "object",
    properties: {
      message: { type: "string" },
      fila: filaEsperaSchema,
    },
  },
  400: {
    type: "object",
    properties: {
      message: { type: "string" },
    },
  },
  409: {
    type: "object",
    properties: {
      message: { type: "string" },
    },
  },
} as const;

export const meusEmprestimosResponseSchema = {
  200: {
    type: "object",
    properties: {
      emprestimos: { type: "array", items: emprestimoSchema },
      filaEspera: { type: "array", items: filaEsperaSchema },
    },
  },
  400: {
    type: "object",
    properties: {
      message: { type: "string" },
    },
  },
} as const;

export const acaoEmprestimoResponseSchema = {
  200: {
    type: "object",
    properties: {
      message: { type: "string" },
      emprestimo: emprestimoSchema,
    },
  },
  400: {
    type: "object",
    properties: {
      message: { type: "string" },
    },
  },
} as const;
