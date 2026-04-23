import { prisma } from "../../database/prisma.js";

export async function listarLivros(query: {
  titulo?: string;
  autor?: string;
  categoria?: string;
  orderBy?: "avaliacao" | "titulo" | "criadoEm";
  page?: number;
  limit?: number;
}) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const skip = (page - 1) * limit;

  const where = {
    ...(query.titulo && {
      titulo: { contains: query.titulo, mode: "insensitive" as const },
    }),
    ...(query.autor && {
      autor: { contains: query.autor, mode: "insensitive" as const },
    }),
    ...(query.categoria && {
      categoria: { contains: query.categoria, mode: "insensitive" as const },
    }),
  };

  const [livros, total] = await prisma.$transaction([
    prisma.livro.findMany({
      where,
      skip,
      take: limit,
      orderBy:
        query.orderBy === "titulo"
          ? { titulo: "asc" }
          : query.orderBy === "criadoEm"
            ? { criadoEm: "desc" }
            : { criadoEm: "desc" },
      select: {
        id: true,
        titulo: true,
        autor: true,
        isbn: true,
        sinopse: true,
        capaUrl: true,
        categoria: true,
        criadoEm: true,
        exemplares: {
          select: { status: true },
        },
        avaliacoes: {
          select: { nota: true },
        },
      },
    }),
    prisma.livro.count({ where }),
  ]);

  const data = livros.map((livro) => {
    const totalExemplares = livro.exemplares.length;
    const exemplaresDisponiveis = livro.exemplares.filter(
      (e) => e.status === "DISPONIVEL",
    ).length;
    const mediaAvaliacao =
      livro.avaliacoes.length > 0
        ? livro.avaliacoes.reduce((acc, a) => acc + Number(a.nota), 0) /
          livro.avaliacoes.length
        : 0;

    return {
      id: livro.id,
      titulo: livro.titulo,
      autor: livro.autor,
      isbn: livro.isbn,
      sinopse: livro.sinopse,
      capaUrl: livro.capaUrl,
      categoria: livro.categoria,
      criadoEm: livro.criadoEm,
      totalExemplares,
      exemplaresDisponiveis,
      mediaAvaliacao: Math.round(mediaAvaliacao * 10) / 10,
    };
  });

  return { data, total, page, limit };
}

export async function buscarLivroPorId(id: string) {
  const livro = await prisma.livro.findUnique({
    where: { id },
    select: {
      id: true,
      titulo: true,
      autor: true,
      isbn: true,
      sinopse: true,
      capaUrl: true,
      categoria: true,
      criadoEm: true,
      exemplares: {
        select: {
          id: true,
          numeroTombo: true,
          status: true,
        },
      },
      avaliacoes: {
        select: { nota: true },
      },
    },
  });

  if (!livro) {
    throw new Error("Livro não encontrado");
  }

  const mediaAvaliacao =
    livro.avaliacoes.length > 0
      ? livro.avaliacoes.reduce((acc, a) => acc + Number(a.nota), 0) /
        livro.avaliacoes.length
      : 0;

  return {
    id: livro.id,
    titulo: livro.titulo,
    autor: livro.autor,
    isbn: livro.isbn,
    sinopse: livro.sinopse,
    capaUrl: livro.capaUrl,
    categoria: livro.categoria,
    criadoEm: livro.criadoEm,
    totalExemplares: livro.exemplares.length,
    exemplaresDisponiveis: livro.exemplares.filter((e) => e.status === "DISPONIVEL")
      .length,
    mediaAvaliacao: Math.round(mediaAvaliacao * 2) / 2,
    exemplares: livro.exemplares,
  };
}

export async function criarLivro(data: {
  titulo: string;
  autor: string;
  isbn: string;
  sinopse?: string;
  capaUrl?: string;
  categoria: string;
}) {
  const livroExistente = await prisma.livro.findUnique({
    where: { isbn: data.isbn },
  });

  if (livroExistente) {
    throw new Error("Já existe um livro com esse ISBN");
  }

  return await prisma.livro.create({
    data,
    select: {
      id: true,
      titulo: true,
      autor: true,
      isbn: true,
      sinopse: true,
      capaUrl: true,
      categoria: true,
      criadoEm: true,

    },
  });
}

export async function editarLivro(
  id: string,
  data: {
    titulo?: string;
    autor?: string;
    sinopse?: string;
    capaUrl?: string;
    categoria?: string;
  },
) {
  const livroExistente = await prisma.livro.findUnique({
    where: { id },
  });

  if (!livroExistente) {
    throw new Error("Livro não encontrado");
  }

  return await prisma.livro.update({
    where: { id },
    data,
    select: {
      id: true,
      titulo: true,
      autor: true,
      isbn: true,
      sinopse: true,
      capaUrl: true,
      categoria: true,
      criadoEm: true,
    },
  });
}

// ─────────────────────────────────────────
// ADICIONAR EXEMPLAR
// ─────────────────────────────────────────
export async function adicionarExemplar(livroId: string, numeroTombo: string) {
  const livroExistente = await prisma.livro.findUnique({
    where: { id: livroId },
  });

  if (!livroExistente) {
    throw new Error("Livro não encontrado");
  }

  const tomboExistente = await prisma.exemplarLivro.findUnique({
    where: { numeroTombo },
  });

  if (tomboExistente) {
    throw new Error("Já existe um exemplar com esse número de tombo");
  }

  return await prisma.exemplarLivro.create({
    data: { livroId, numeroTombo },
    select: {
      id: true,
      numeroTombo: true,
      status: true,
    },
  });
}
