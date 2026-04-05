-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ALUNO', 'ADMIN');

-- CreateEnum
CREATE TYPE "StatusLivro" AS ENUM ('DISPONIVEL', 'INDISPONIVEL');

-- CreateEnum
CREATE TYPE "StatusEmprestimo" AS ENUM ('PENDENTE', 'ATIVO', 'DEVOLVIDO', 'NEGADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "StatusFila" AS ENUM ('AGUARDANDO', 'NOTIFICADO', 'EXPIRADO');

-- CreateEnum
CREATE TYPE "StatusMulta" AS ENUM ('PENDENTE', 'PAGO');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "matricula" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'ALUNO',
    "banidoAte" TIMESTAMP(3),
    "banidoPermanente" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Livro" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "autor" TEXT NOT NULL,
    "isbn" TEXT NOT NULL,
    "sinopse" TEXT,
    "capaUrl" TEXT,
    "categoria" TEXT NOT NULL,
    "status" "StatusLivro" NOT NULL DEFAULT 'DISPONIVEL',
    "quantidadeTotal" INTEGER NOT NULL,
    "quantidadeDisponivel" INTEGER NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Livro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Emprestimo" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "livroId" TEXT NOT NULL,
    "status" "StatusEmprestimo" NOT NULL DEFAULT 'PENDENTE',
    "motivoNegacao" TEXT,
    "dataSolicitacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataAprovacao" TIMESTAMP(3),
    "dataDevolucaoPrevista" TIMESTAMP(3),
    "dataDevolucaoReal" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Emprestimo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FilaEspera" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "livroId" TEXT NOT NULL,
    "posicao" INTEGER NOT NULL,
    "status" "StatusFila" NOT NULL DEFAULT 'AGUARDANDO',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FilaEspera_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Multa" (
    "id" TEXT NOT NULL,
    "emprestimoId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "valorTotal" DECIMAL(10,2) NOT NULL,
    "diasAtraso" INTEGER NOT NULL,
    "status" "StatusMulta" NOT NULL DEFAULT 'PENDENTE',
    "dataPagamento" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Multa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Avaliacao" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "livroId" TEXT NOT NULL,
    "nota" DECIMAL(2,1) NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Avaliacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comentario" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "livroId" TEXT NOT NULL,
    "parentId" TEXT,
    "conteudo" TEXT NOT NULL,
    "deletado" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comentario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComentarioLike" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "comentarioId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComentarioLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Banimento" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "banidoAte" TIMESTAMP(3),
    "permanente" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Banimento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_matricula_key" ON "Usuario"("matricula");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Livro_isbn_key" ON "Livro"("isbn");

-- CreateIndex
CREATE UNIQUE INDEX "FilaEspera_usuarioId_livroId_key" ON "FilaEspera"("usuarioId", "livroId");

-- CreateIndex
CREATE UNIQUE INDEX "Multa_emprestimoId_key" ON "Multa"("emprestimoId");

-- CreateIndex
CREATE UNIQUE INDEX "Avaliacao_usuarioId_livroId_key" ON "Avaliacao"("usuarioId", "livroId");

-- CreateIndex
CREATE UNIQUE INDEX "ComentarioLike_usuarioId_comentarioId_key" ON "ComentarioLike"("usuarioId", "comentarioId");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");

-- AddForeignKey
ALTER TABLE "Emprestimo" ADD CONSTRAINT "Emprestimo_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Emprestimo" ADD CONSTRAINT "Emprestimo_livroId_fkey" FOREIGN KEY ("livroId") REFERENCES "Livro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FilaEspera" ADD CONSTRAINT "FilaEspera_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FilaEspera" ADD CONSTRAINT "FilaEspera_livroId_fkey" FOREIGN KEY ("livroId") REFERENCES "Livro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Multa" ADD CONSTRAINT "Multa_emprestimoId_fkey" FOREIGN KEY ("emprestimoId") REFERENCES "Emprestimo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Multa" ADD CONSTRAINT "Multa_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Avaliacao" ADD CONSTRAINT "Avaliacao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Avaliacao" ADD CONSTRAINT "Avaliacao_livroId_fkey" FOREIGN KEY ("livroId") REFERENCES "Livro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comentario" ADD CONSTRAINT "Comentario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comentario" ADD CONSTRAINT "Comentario_livroId_fkey" FOREIGN KEY ("livroId") REFERENCES "Livro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comentario" ADD CONSTRAINT "Comentario_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Comentario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComentarioLike" ADD CONSTRAINT "ComentarioLike_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComentarioLike" ADD CONSTRAINT "ComentarioLike_comentarioId_fkey" FOREIGN KEY ("comentarioId") REFERENCES "Comentario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Banimento" ADD CONSTRAINT "Banimento_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Banimento" ADD CONSTRAINT "Banimento_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
