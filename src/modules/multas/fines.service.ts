import { prisma } from "../../database/prisma";

export async function listarMultas() {
  const multas = await prisma.multa.findMany({
    orderBy: { criadoEm: "desc" },
  });
  return { multas };
}

export async function minhasMultas(usuarioId: string) {
  const multas = await prisma.multa.findMany({
    where: { usuarioId },
    orderBy: { criadoEm: "desc" },
  });
  return { multas };
}

export async function quitarMulta(multaId: string) {
  const multa = await prisma.multa.findUnique({
    where: { id: multaId },
  });

  if (!multa || multa.status !== "PENDENTE") {
    throw new Error("Multa não encontrada ou já quitada");
  }

  const atualizado = await prisma.multa.update({
    where: { id: multaId },
    data: {
      status: "PAGO",
      dataPagamento: new Date(),
    },
  });

  return { message: "Multa quitada com sucesso pelo Administrador", multa: atualizado };
}

export async function pagarMulta(usuarioId: string, multaId: string) {
  const multa = await prisma.multa.findUnique({
    where: { id: multaId },
  });

  if (!multa || multa.usuarioId !== usuarioId || multa.status !== "PENDENTE") {
    throw new Error("Multa inválida para pagamento");
  }

  // TODO: FASE 9 - Integração com Gateway de Pagamento (Stripe/MercadoPago)
  // Para a V1, estamos apenas simulando o sucesso para o aluno continuar testando.
  const atualizado = await prisma.multa.update({
    where: { id: multaId },
    data: {
      status: "PAGO",
      dataPagamento: new Date(),
    },
  });

  return { 
    message: "Pagamento simulado via App realizado com sucesso! (Aguardando Fase 9 para Gateway Real)", 
    multa: atualizado 
  };
}
