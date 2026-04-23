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
    ativo: true, // Por padrão listar apenas livros ativos
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
        anoPublicacao: true,
        editora: true,
        idioma: true,
        paginas: true,
        ativo: true,
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
      anoPublicacao: livro.anoPublicacao,
      editora: livro.editora,
      idioma: livro.idioma,
      paginas: livro.paginas,
      ativo: livro.ativo,
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
      anoPublicacao: true,
      editora: true,
      idioma: true,
      paginas: true,
      ativo: true,
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
    anoPublicacao: livro.anoPublicacao,
    editora: livro.editora,
    idioma: livro.idioma,
    paginas: livro.paginas,
    ativo: livro.ativo,
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
  anoPublicacao?: number;
  editora?: string;
  idioma?: string;
  paginas?: number;
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
      anoPublicacao: true,
      editora: true,
      idioma: true,
      paginas: true,
      ativo: true,
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
    anoPublicacao?: number;
    editora?: string;
    idioma?: string;
    paginas?: number;
    ativo?: boolean;
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
      anoPublicacao: true,
      editora: true,
      idioma: true,
      paginas: true,
      ativo: true,
      criadoEm: true,
    },
  });
}

export async function desativarLivro(id: string) {
  const livroExistente = await prisma.livro.findUnique({
    where: { id },
  });

  if (!livroExistente) {
    throw new Error("Livro não encontrado");
  }

  return await prisma.livro.update({
    where: { id },
    data: { ativo: false },
    select: {
      id: true,
      titulo: true,
      autor: true,
      isbn: true,
      sinopse: true,
      capaUrl: true,
      categoria: true,
      anoPublicacao: true,
      editora: true,
      idioma: true,
      paginas: true,
      ativo: true,
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

// ─────────────────────────────────────────
// ATUALIZAR STATUS DO EXEMPLAR
// ─────────────────────────────────────────
export async function atualizarStatusExemplar(
  exemplarId: string,
  status: "DISPONIVEL" | "EMPRESTADO" | "INDISPONIVEL",
) {
  const exemplarExistente = await prisma.exemplarLivro.findUnique({
    where: { id: exemplarId },
  });

  if (!exemplarExistente) {
    throw new Error("Exemplar não encontrado");
  }

  return await prisma.exemplarLivro.update({
    where: { id: exemplarId },
    data: { status },
    select: {
      id: true,
      numeroTombo: true,
      status: true,
    },
  });
}

// ─────────────────────────────────────────
// DELETAR EXEMPLAR
// ─────────────────────────────────────────
export async function deletarExemplar(exemplarId: string) {
  const exemplar = await prisma.exemplarLivro.findUnique({
    where: { id: exemplarId },
    include: {
      emprestimos: {
        where: {
          status: { in: ["PENDENTE", "AGUARDANDO_ENTREGA", "ATIVO"] },
        },
      },
    },
  });

  if (!exemplar) {
    throw new Error("Exemplar não encontrado");
  }

  if (exemplar.emprestimos.length > 0) {
    throw new Error("Exemplar possui empréstimo ativo e não pode ser removido");
  }

  return await prisma.exemplarLivro.delete({
    where: { id: exemplarId },
    select: {
      id: true,
      numeroTombo: true,
      status: true,
    },
  });
}
