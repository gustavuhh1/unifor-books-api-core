import { hashSenha } from "../../lib/hash";
import { prisma } from "../../database/prisma";

export async function criarUsuario(data: {
  matricula: string;
  nome: string;
  email: string;
  senha: string;
  role?: "ALUNO" | "ADMIN";
}) {
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
      role: data.role || "ALUNO",
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

export async function buscarUsuarioPorId(id: string) {
  const usuario = await prisma.usuario.findUnique({
    where: { id },
    select: {
      id: true,
      matricula: true,
      nome: true,
      email: true,
      role: true,
      criadoEm: true,
    },
  });

  return usuario;
}