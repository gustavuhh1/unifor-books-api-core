import { prisma } from "../src/database/prisma";
import { hashSenha } from "../src/lib/hash";

async function main() {
  console.log("🌱 Iniciando o seed do banco de dados...");

  // Limpar dados existentes na ordem correta (filhos primeiro) para evitar erro de Foreign Key
  await prisma.auditLog.deleteMany();
  await prisma.session.deleteMany();
  await prisma.banimento.deleteMany();
  await prisma.comentarioLike.deleteMany();
  await prisma.comentario.deleteMany();
  await prisma.avaliacao.deleteMany();
  await prisma.multa.deleteMany();
  await prisma.emprestimo.deleteMany();
  await prisma.filaEspera.deleteMany();
  await prisma.exemplarLivro.deleteMany();
  await prisma.livro.deleteMany();
  await prisma.usuario.deleteMany();
  await prisma.configuracao.deleteMany();

  // 1. Criar Configurações Padrão
  console.log("⚙️ Criando configurações do sistema...");
  await prisma.configuracao.createMany({
    data: [
      {
        chave: "MULTA_VALOR_DIARIO",
        valor: "2.50",
        descricao: "Valor diário da multa por atraso (R$)",
      },
      {
        chave: "PRAZO_EMPRESTIMO_DIAS",
        valor: "7",
        descricao: "Prazo padrão para empréstimos (em dias úteis)",
      },
      {
        chave: "PRAZO_RETIRADA_DIAS",
        valor: "2",
        descricao: "Prazo para retirar livro aprovado (em dias úteis)",
      },
    ],
  });

  // Criar senhas hasheadas
  const senhaPadrao = await hashSenha("123456");

  // 2. Criar Usuários
  console.log("👤 Criando usuários...");
  const admin = await prisma.usuario.create({
    data: {
      matricula: "admin",
      nome: "Administrador Mestre",
      email: "admin@unifor.br",
      senhaHash: senhaPadrao,
      role: "ADMIN",
    },
  });

  const aluno = await prisma.usuario.create({
    data: {
      matricula: "1234567",
      nome: "João Aluno",
      email: "joao@unifor.br",
      senhaHash: senhaPadrao,
      role: "ALUNO",
    },
  });

  // 3. Criar Livros
  console.log("📚 Criando livros...");
  const livro1 = await prisma.livro.create({
    data: {
      titulo: "Clean Code: A Handbook of Agile Software Craftsmanship",
      autor: "Robert C. Martin",
      isbn: "978-0132350884",
      categoria: "Tecnologia",
      anoPublicacao: 2008,
      editora: "Prentice Hall",
    },
  });

  const livro2 = await prisma.livro.create({
    data: {
      titulo: "Domain-Driven Design: Tackling Complexity in the Heart of Software",
      autor: "Eric Evans",
      isbn: "978-0321125217",
      categoria: "Engenharia de Software",
      anoPublicacao: 2003,
      editora: "Addison-Wesley Professional",
    },
  });

  const livro3 = await prisma.livro.create({
    data: {
      titulo: "Arquitetura Limpa",
      autor: "Robert C. Martin",
      isbn: "978-8550804606",
      categoria: "Tecnologia",
      anoPublicacao: 2019,
      editora: "Alta Books",
    },
  });

  // 4. Criar Exemplares
  console.log("📖 Criando exemplares...");
  await prisma.exemplarLivro.createMany({
    data: [
      { livroId: livro1.id, numeroTombo: "TOMBO-001", status: "DISPONIVEL" },
      { livroId: livro1.id, numeroTombo: "TOMBO-002", status: "DISPONIVEL" },
      { livroId: livro1.id, numeroTombo: "TOMBO-003", status: "DISPONIVEL" },

      { livroId: livro2.id, numeroTombo: "TOMBO-004", status: "DISPONIVEL" },
      { livroId: livro2.id, numeroTombo: "TOMBO-005", status: "DISPONIVEL" },

      { livroId: livro3.id, numeroTombo: "TOMBO-006", status: "DISPONIVEL" },
    ],
  });

  console.log("✅ Seed finalizado com sucesso!");
  console.log("--- Credenciais para testar ---");
  console.log(`👨‍💻 Admin: email '${admin.email}' | senha '123456'`);
  console.log(`🎓 Aluno: email '${aluno.email}' | senha '123456'`);
}

main()
  .catch((e) => {
    console.error("❌ Erro durante o seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
