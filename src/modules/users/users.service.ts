import { hashSenha } from "@lib/hash.js";
import { prisma } from "../../database/prisma.js";
import type { CriarUsuarioInput } from "./users.schema.js";

export async function criarUsuario(data: CriarUsuarioInput) {
  const usuarioExistente = await prisma.usuario.findFirst({
    where: {
      OR: [{ email: data.email }, { matricula: data.matricula }],
    },
  });

  if (usuarioExistente) {
    throw new Error("Já existe um usuário com esse email ou matrícula");
  }

  const senhaHash = await hashSenha(data.senha);

  const usuario = await prisma.usuario.create({
    data: {
      matricula: data.matricula,
      nome: data.nome,
      email: data.email,
      senhaHash,
      role: data.role,
    },
    select: {
      id: true,
      matricula: true,
      nome: true,
      email: true,
      role: true,
      criadoEm: true,
    },
  });

  const response = Object.fromEntries(
    Object.entries(usuario).filter(([key]) => key !== "senhaHash"),
  );

  return response;
}

export async function listarUsuarios() {
  const usuarios = await prisma.usuario.findMany({
    select: {
      id: true,
      matricula: true,
      nome: true,
      email: true,
      role: true,
      criadoEm: true,
    },
  });

  return usuarios;
}
