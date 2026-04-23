export const criarLivroBodySchema = {
  type: "object",
  required: ["titulo", "autor", "isbn", "categoria"],
  properties: {
    titulo: { type: "string" },
    autor: { type: "string" },
    isbn: { type: "string" },
    sinopse: { type: "string" },
    capaUrl: { type: "string" },
    categoria: { type: "string" },
  },
} as const;

export const editarLivroBodySchema = {
  type: "object",
  properties: {
    titulo: { type: "string" },
    autor: { type: "string" },
    sinopse: { type: "string" },
    capaUrl: { type: "string" },
    categoria: { type: "string" },
  },
} as const;

export const listarLivrosQuerySchema = {
  type: "object",
  properties: {
    titulo: { type: "string" },
    autor: { type: "string" },
    categoria: { type: "string" },
    orderBy: { type: "string", enum: ["avaliacao", "titulo", "criadoEm"] },
    page: { type: "number", default: 1 },
    limit: { type: "number", default: 20 },
  },
} as const;

export const adicionarExemplarBodySchema = {
  type: "object",
  required: ["numeroTombo"],
  properties: {
    numeroTombo: { type: "string" },
  },
} as const;

const exemplarSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    numeroTombo: { type: "string" },
    status: { type: "string", enum: ["DISPONIVEL", "EMPRESTADO", "INDISPONIVEL"] },
  },
} as const;

const livroSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    titulo: { type: "string" },
    autor: { type: "string" },
    isbn: { type: "string" },
    sinopse: { type: "string" },
    capaUrl: { type: "string" },
    categoria: { type: "string" },
    criadoEm: { type: "string" },
    totalExemplares: { type: "number" },
    exemplaresDisponiveis: { type: "number" },
    mediaAvaliacao: { type: "number" },
  },
} as const;

export const listarLivrosResponseSchema = {
  200: {
    type: "object",
    properties: {
      data: { type: "array", items: livroSchema },
      total: { type: "number" },
      page: { type: "number" },
      limit: { type: "number" },
    },
  },
  500: {
    type: "object",
    properties: {
      message: { type: "string" },
    },
  },
} as const;

export const buscarLivroPorIdResponseSchema = {
  200: {
    type: "object",
    properties: {
      ...livroSchema.properties,
      exemplares: { type: "array", items: exemplarSchema },
    },
  },
  404: {
    type: "object",
    properties: {
      message: { type: "string" },
    },
  },
} as const;

export const criarLivroResponseSchema = {
  201: {
    type: "object",
    properties: livroSchema.properties,
  },
  409: {
    type: "object",
    properties: {
      message: { type: "string" },
    },
  },
} as const;

export const editarLivroResponseSchema = {
  200: {
    type: "object",
    properties: livroSchema.properties,
  },
  404: {
    type: "object",
    properties: {
      message: { type: "string" },
    },
  },
} as const;

export const adicionarExemplarResponseSchema = {
  201: {
    type: "object",
    properties: exemplarSchema.properties,
  },
  409: {
    type: "object",
    properties: {
      message: { type: "string" },
    },
  },
} as const;
