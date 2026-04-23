import { prisma } from "../../database/prisma";

/**
 * Busca uma configuração no banco de dados.
 * Caso não exista, ela é criada automaticamente com o valor padrão para facilitar a vida do administrador.
 */
export async function getSetting(chave: string, defaultValue: string, descricao?: string, ): Promise<string> {
  let config = await prisma.configuracao.findUnique({
    where: { chave },
  });

  if (!config) {
    config = await prisma.configuracao.create({
      data: {
        chave,
        valor: defaultValue,
        descricao: descricao || "Configuração gerada automaticamente pelo sistema",
      },
    });
  }

  return config.valor;
}
