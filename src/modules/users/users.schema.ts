const usuarioSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    matricula: { type: "string" },
    nome: { type: "string" },
    email: { type: "string" },
    role: { type: "string", enum: ["ALUNO", "ADMIN"] },
    criadoEm: { type: "string" },
  },
} as const;

export const criarUsuarioBodySchema = {
  type: "object",
  required: ["matricula", "nome", "email", "senha"],
  properties: {
    matricula: { type: "string" },
    nome: { type: "string" },
    email: { type: "string" },
    senha: { type: "string", minLength: 6 },
    role: { type: "string", enum: ["ALUNO", "ADMIN"], default: "ALUNO" },
  },
} as const;

export const criarUsuarioResponseSchema = {
  201: usuarioSchema,
  409: {
    type: "object",
    properties: {
      message: { type: "string" },
    },
  },
} as const;

export const listarUsuariosResponseSchema = {
  200: {
    type: "object",
    properties: {
      users: { type: "array", items: usuarioSchema },
    },
  },
  500: {
    type: "object",
    properties: {
      message: { type: "string" },
    },
  },
} as const;

export const buscarUsuarioPorIdResponseSchema = {
  200: {
    type: "object",
    properties: {
      user: usuarioSchema,
    },
  },
  404: {
    type: "object",
    properties: {
      message: { type: "string" },
    },
  },
  500: {
    type: "object",
    properties: {
      message: { type: "string" },
    },
  },
} as const;
