import { prisma } from "../../database/prisma.js";

export async function avaliarLivro(
  usuarioId: string,
  livroId: string,
  nota: number,
  texto?: string,
) {
  // Verifica se livro existe e está ativo
  const livro = await prisma.livro.findUnique({ where: { id: livroId } });
  if (!livro || !livro.ativo) {
    throw new Error("Livro não encontrado.");
  }

  // Upsert: cria ou atualiza a avaliação do aluno neste livro (1 avaliação por aluno/livro)
  const avaliacao = await prisma.avaliacao.upsert({
    where: { usuarioId_livroId: { usuarioId, livroId } },
    create: { usuarioId, livroId, nota, texto: texto ?? null },
    update: { nota, texto: texto ?? null },
    select: {
      id: true,
      nota: true,
      texto: true,
      criadoEm: true,
      livro: { select: { id: true, titulo: true } },
    },
  });

  return avaliacao;
}

export async function removerAvaliacao(usuarioId: string, livroId: string) {
  // Verifica se a avaliação existe
  const avaliacao = await prisma.avaliacao.findUnique({
    where: { usuarioId_livroId: { usuarioId, livroId } },
  });

  if (!avaliacao) {
    throw new Error("Avaliação não encontrada.");
  }

  // Remove a avaliação
  await prisma.avaliacao.delete({
    where: { id: avaliacao.id },
  });

  return {
    message: "Avaliação removida com sucesso.",
  };
}
