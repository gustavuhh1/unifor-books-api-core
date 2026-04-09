// Request

export const loginBodySchema = {
  type: "object",
  required: ["matricula", "senha"],
  properties: {
    matricula: { type: "string" },
    senha: { type: "string" },
  },
} as const;

export const refreshBodySchema = {
  type: "object",
  required: ["refreshToken"],
  properties: {
    refreshToken: { type: "string" },
  },
} as const;

export const logoutBodySchema = {
  type: "object",
  required: ["refreshToken"],
  properties: {
    refreshToken: { type: "string" },
  },
} as const;

// Response

export const loginResponseSchema = {
  200: {
    type: "object",
    properties: {
      accessToken: { type: "string" },
      refreshToken: { type: "string" },
      usuario: {
        type: "object",
        properties: {
          id: { type: "string" },
          matricula: { type: "string" },
          nome: { type: "string" },
          email: { type: "string" },
          role: { type: "string", enum: ["ALUNO", "ADMIN"] },
        },
      },
    },
  },
  401: {
    type: "object",
    properties: {
      message: { type: "string" },
      error: { type: "string" },
    },
  },
} as const;

export const refreshResponseSchema = {
  200: {
    type: "object",
    properties: {
      accessToken: { type: "string" },
    },
  },
  401: {
    type: "object",
    properties: {
      message: { type: "string" },
    },
  },
} as const;

export const logoutResponseSchema = {
  200: {
    type: "object",
    properties: {
      message: { type: "string" },
    },
  },
} as const;
