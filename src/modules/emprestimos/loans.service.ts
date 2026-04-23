import { addBusinessDays, addDays, differenceInBusinessDays } from "date-fns";
import { prisma } from "../../database/prisma";
import { getSetting } from "../../shared/config/settings";

export async function solicitar(usuarioId: string, livroId: string) {
  // 1. Checar multas
  const multas = await prisma.multa.findFirst({
    where: { usuarioId, status: "PENDENTE" },
  });
  if (multas) {
    throw new Error("Usuário possui multas pendentes e não pode solicitar empréstimos");
  }

  // 2. Checar empréstimos em atraso
  const atrasados = await prisma.emprestimo.findFirst({
    where: {
      usuarioId,
      status: "ATIVO",
      dataDevolucaoPrevista: { lt: new Date() },
    },
  });
  if (atrasados) {
    throw new Error(
      "Usuário possui empréstimos em atraso e não pode solicitar novos empréstimos",
    );
  }

  // 3. Checar limite (Max 10)
  const totalEmprestimos = await prisma.emprestimo.count({
    where: { usuarioId, status: { in: ["PENDENTE", "AGUARDANDO_ENTREGA", "ATIVO"] } },
  });
  if (totalEmprestimos >= 10) {
    throw new Error("Limite de 10 empréstimos ativos/pendentes atingido");
  }

  // 4. Checar duplicidade de empréstimo para o mesmo livro
  const jaPossui = await prisma.emprestimo.findFirst({
    where: {
      usuarioId,
      exemplar: { livroId },
      status: { in: ["PENDENTE", "AGUARDANDO_ENTREGA", "ATIVO"] },
    },
  });
  if (jaPossui) {
    throw new Error(
      "Usuário já possui um empréstimo ou solicitação pendente para este livro",
    );
  }

  // 5. Checar se já está na fila
  const naFila = await prisma.filaEspera.findUnique({
    where: { usuarioId_livroId: { usuarioId, livroId } },
  });
  if (naFila) {
    throw new Error("Usuário já está na fila de espera para este livro");
  }

  // 6. Buscar exemplar disponível (que não tenha outro emprestimo pendente ou ativo)
  const exemplaresDisponiveis = await prisma.exemplarLivro.findMany({
    where: {
      livroId,
      status: "DISPONIVEL",
      emprestimos: {
        none: { status: { in: ["PENDENTE", "AGUARDANDO_ENTREGA", "ATIVO"] } },
      },
    },
  });

  if (exemplaresDisponiveis.length > 0) {
    const exemplar = exemplaresDisponiveis[0];
    if (!exemplar) throw new Error("Erro interno: Exemplar não encontrado");

    const emprestimo = await prisma.emprestimo.create({
      data: {
        usuarioId,
        exemplarId: exemplar.id,
        status: "PENDENTE",
      },
    });
    return { message: "Solicitação realizada com sucesso", emprestimo };
  } else {
    // 7. Não há exemplares. Adicionar à fila de espera
    const ultimaPosicao = await prisma.filaEspera.findFirst({
      where: { livroId },
      orderBy: { posicao: "desc" },
    });
    const posicao = ultimaPosicao ? ultimaPosicao.posicao + 1 : 1;

    const fila = await prisma.filaEspera.create({
      data: {
        usuarioId,
        livroId,
        posicao,
        status: "AGUARDANDO",
      },
    });
    return {
      status: "FILA",
      message: "Livro indisponível. Usuário adicionado à fila de espera.",
      fila,
    };
  }
}

export async function meusEmprestimos(usuarioId: string) {
  const emprestimos = await prisma.emprestimo.findMany({
    where: { usuarioId },
    orderBy: { criadoEm: "desc" },
  });

  const filaEspera = await prisma.filaEspera.findMany({
    where: { usuarioId },
    orderBy: { criadoEm: "desc" },
  });

  return { emprestimos, filaEspera };
}

export async function aprovar(emprestimoId: string) {
  const emprestimo = await prisma.emprestimo.findUnique({
    where: { id: emprestimoId },
    include: { exemplar: true },
  });

  if (!emprestimo || emprestimo.status !== "PENDENTE") {
    throw new Error("Empréstimo não encontrado ou não está pendente");
  }

  // Padrão de 2 dias úteis para prazo de retirada
  const diasDePrazo = parseInt(await getSetting("DIAS_PRAZO_RETIRADA", "2"), 10);
  const dataLimiteRetirada = addBusinessDays(new Date(), diasDePrazo);

  const atualizado = await prisma.$transaction(async (tx) => {
    const emp = await tx.emprestimo.update({
      where: { id: emprestimoId },
      data: {
        status: "AGUARDANDO_ENTREGA",
        dataAprovacao: new Date(),
        dataLimiteRetirada,
      },
    });

    await tx.exemplarLivro.update({
      where: { id: emprestimo.exemplarId },
      data: { status: "EMPRESTADO" },
    });

    return emp;
  });

  return {
    message: "Empréstimo aprovado. Aguardando entrega ao aluno.",
    emprestimo: atualizado,
  };
}

export async function entregar(emprestimoId: string) {
  const emprestimo = await prisma.emprestimo.findUnique({
    where: { id: emprestimoId },
  });

  if (!emprestimo || emprestimo.status !== "AGUARDANDO_ENTREGA") {
    throw new Error("Empréstimo não encontrado ou não está aguardando entrega");
  }

  const diasEmprestimo = parseInt(await getSetting("DIAS_PRAZO_EMPRESTIMO", "14"), 10);
  const dataDevolucaoPrevista = addDays(new Date(), diasEmprestimo);

  const atualizado = await prisma.emprestimo.update({
    where: { id: emprestimoId },
    data: {
      status: "ATIVO",
      dataDevolucaoPrevista,
    },
  });

  return {
    message: "Livro entregue ao aluno. Empréstimo ativado.",
    emprestimo: atualizado,
  };
}

export async function cancelar(emprestimoId: string) {
  const emprestimo = await prisma.emprestimo.findUnique({
    where: { id: emprestimoId },
  });

  if (!emprestimo || emprestimo.status !== "AGUARDANDO_ENTREGA") {
    throw new Error("Somente empréstimos aguardando entrega podem ser cancelados");
  }

  const atualizado = await prisma.$transaction(async (tx) => {
    const emp = await tx.emprestimo.update({
      where: { id: emprestimoId },
      data: { status: "CANCELADO" },
    });

    await tx.exemplarLivro.update({
      where: { id: emprestimo.exemplarId },
      data: { status: "DISPONIVEL" },
    });

    return emp;
  });

  return { message: "Reserva cancelada com sucesso", emprestimo: atualizado };
}

export async function negar(emprestimoId: string, motivoNegacao: string) {
  const emprestimo = await prisma.emprestimo.findUnique({
    where: { id: emprestimoId },
  });

  if (!emprestimo || emprestimo.status !== "PENDENTE") {
    throw new Error("Empréstimo não encontrado ou não está pendente");
  }

  const atualizado = await prisma.emprestimo.update({
    where: { id: emprestimoId },
    data: {
      status: "NEGADO",
      motivoNegacao,
    },
  });

  return { message: "Empréstimo negado", emprestimo: atualizado };
}

export async function devolver(emprestimoId: string) {
  const emprestimo = await prisma.emprestimo.findUnique({
    where: { id: emprestimoId },
  });

  if (!emprestimo || emprestimo.status !== "ATIVO") {
    throw new Error("Empréstimo não encontrado ou não está ativo");
  }

  const atualizado = await prisma.$transaction(async (tx) => {
    const emp = await tx.emprestimo.update({
      where: { id: emprestimoId },
      data: {
        status: "DEVOLVIDO",
        dataDevolucaoReal: new Date(),
      },
    });

    await tx.exemplarLivro.update({
      where: { id: emprestimo.exemplarId },
      data: { status: "DISPONIVEL" },
    });

    // Gatilho de Multa
    if (emp.dataDevolucaoPrevista && new Date() > emp.dataDevolucaoPrevista) {
      const diffDays = differenceInBusinessDays(new Date(), emp.dataDevolucaoPrevista);

      // Padrão de 2 reais por dia
      const valorMulta = parseFloat(await getSetting("VALOR_MULTA_DIARIA", "2.00"));

      await tx.multa.create({
        data: {
          emprestimoId: emp.id,
          usuarioId: emp.usuarioId,
          valorTotal: diffDays * valorMulta,
          diasAtraso: diffDays,
          status: "PENDENTE",
        },
      });
    }

    return emp;
  });

  return { message: "Empréstimo devolvido com sucesso", emprestimo: atualizado };
}

export async function renovar(usuarioId: string, emprestimoId: string) {
  const emprestimo = await prisma.emprestimo.findUnique({
    where: { id: emprestimoId },
    include: { exemplar: true, multa: true },
  });

  if (
    !emprestimo ||
    emprestimo.usuarioId !== usuarioId ||
    emprestimo.status !== "ATIVO"
  ) {
    throw new Error("Empréstimo inválido para renovação");
  }
  // Checar se o empréstimo está em atraso
  if (emprestimo.dataDevolucaoPrevista && new Date() > emprestimo.dataDevolucaoPrevista) {
    throw new Error("Não é possível renovar empréstimos em atraso");
  }

  //Checar se o empréstimo tem multa
  if (emprestimo.multa?.status !== "PAGO") {
    throw new Error("Não é possível renovar empréstimos com multa pendente");
  }

  //Checar se o empréstimo está em fila de espera
  const naFila = await prisma.filaEspera.findFirst({
    where: {
      livroId: emprestimo.exemplar.livroId,
      status: "AGUARDANDO",
    },
  });

  if (naFila) {
    throw new Error(
      "Não é possível renovar: há outros alunos na fila de espera para este livro",
    );
  }

  const diasEmprestimo = parseInt(await getSetting("DIAS_PRAZO_EMPRESTIMO", "14"));
  const dataDevolucaoPrevista = addDays(new Date(), diasEmprestimo);

  // REALIZA A RENOVAÇÃO
  const atualizado = await prisma.emprestimo.update({
    where: { id: emprestimoId },
    data: {
      dataDevolucaoPrevista: dataDevolucaoPrevista,
    },
  });

  return {
    message: `Empréstimo renovado por mais ${diasEmprestimo} dias`,
    emprestimo: atualizado,
  };
}
