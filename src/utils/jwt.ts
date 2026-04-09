import { SignJWT, jwtVerify, type JWTPayload } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);
const jwtExpiresIn = process.env.JWT_EXPIRES_IN || "15m";
const refreshJwtExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

type UserTokenPayload = {
  sub: string;
  matricula: string;
  role: string;
};

type RefreshTokenPayload = {
  sub: string;
  sessionId: string;
  type: "refresh";
};

// Gera o accessToken de curta duração (15 min).
//  Esse token vai no header de todas as requisições autenticadas: Authorization: Bearer <token>
export async function signAccessToken(payload: UserTokenPayload) {
  return await new SignJWT({
    matricula: payload.matricula,
    role: payload.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(jwtExpiresIn)
    .sign(secret);
}

// Gera o refreshToken de longa duração (7 dias).
//  Esse token é guardado no banco de dados e é usado para gerar novos accessTokens quando eles expirarem.
export async function signRefreshToken(payload: RefreshTokenPayload) {
  return await new SignJWT({
    sessionId: payload.sessionId,
    type: payload.type,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(refreshJwtExpiresIn)
    .sign(secret);
}

// Verifica o accessToken e retorna o payload se for válido. Caso contrário, lança um erro.
export async function verifyAccessToken(token: string) {
  const { payload } = await jwtVerify(token, secret, {
    algorithms: ["HS256"],
  });

  return payload as JWTPayload & {
    sub: string;
    matricula: string;
    role: string;
  };
}

export async function verifyRefreshToken(token: string) {
  const { payload } = await jwtVerify(token, secret, {
    algorithms: ["HS256"],
  });

  return payload as JWTPayload & {
    sub: string;
    sessionId: string;
    type: "refresh";
  };
}
