import { prisma } from "@prisma/prisma";
import { verificarSenha } from "@lib/hash";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "@utils/jwt";

export async function login(matricula: string, senha: string) {
  const usuario = await prisma.usuario.findUnique({
    where: { matricula },
  });

  if (!usuario) {
    throw new Error("Credenciais inválidas");
  }

  const senhaOk = await verificarSenha(senha, usuario.senhaHash);
  if (!senhaOk) {
    throw new Error("Credenciais inválidas");
  }

  const registro = await prisma.session.create({
    data: {
      userId: usuario.id,
      refreshToken: "pending",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const accessToken = await signAccessToken({
    sub: usuario.id,
    matricula: usuario.matricula,
    role: usuario.role,
  });

  const refreshToken = await signRefreshToken({
    sub: usuario.id,
    sessionId: registro.id,
    type: "refresh",
  });

  await prisma.session.update({
    where: { id: registro.id },
    data: { refreshToken },
  });

  return {
    accessToken,
    refreshToken,
    usuario: {
      id: usuario.id,
      matricula: usuario.matricula,
      nome: usuario.nome,
      email: usuario.email,
      role: usuario.role,
    },
  };
}

export async function refresh(refreshToken: string) {
  const payload = await verifyRefreshToken(refreshToken);

  const registro = await prisma.session.findUnique({
    where: { id: payload.sessionId },
    include: { usuario: true },
  });

  if (!registro || registro.refreshToken !== refreshToken) {
    throw new Error("Sessão inválida ou expirada");
  }

  if (registro.expiresAt < new Date()) {
    await prisma.session.deleteMany({ where: { id: registro.id } });
    throw new Error("Sessão expirada");
  }

  const accessToken = await signAccessToken({
    sub: registro.usuario.id,
    matricula: registro.usuario.matricula,
    role: registro.usuario.role,
  });

  return { accessToken };
}

export async function logout(refreshToken: string) {
  await prisma.session.deleteMany({
    where: { refreshToken },
  });
}
