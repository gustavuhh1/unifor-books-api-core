/*
  Warnings:

  - A unique constraint covering the columns `[refreshToken]` on the table `Session` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `atualizadoEm` to the `Avaliacao` table without a default value. This is not possible if the table is not empty.
  - Added the required column `atualizadoEm` to the `Banimento` table without a default value. This is not possible if the table is not empty.
  - Added the required column `atualizadoEm` to the `Comentario` table without a default value. This is not possible if the table is not empty.
  - Added the required column `atualizadoEm` to the `ComentarioLike` table without a default value. This is not possible if the table is not empty.
  - Added the required column `atualizadoEm` to the `Emprestimo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `atualizadoEm` to the `ExemplarLivro` table without a default value. This is not possible if the table is not empty.
  - Added the required column `atualizadoEm` to the `FilaEspera` table without a default value. This is not possible if the table is not empty.
  - Added the required column `atualizadoEm` to the `Livro` table without a default value. This is not possible if the table is not empty.
  - Added the required column `atualizadoEm` to the `Multa` table without a default value. This is not possible if the table is not empty.
  - Added the required column `atualizadoEm` to the `Session` table without a default value. This is not possible if the table is not empty.
  - Added the required column `atualizadoEm` to the `Usuario` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Comentario" DROP CONSTRAINT "Comentario_parentId_fkey";

-- DropForeignKey
ALTER TABLE "ComentarioLike" DROP CONSTRAINT "ComentarioLike_comentarioId_fkey";

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_userId_fkey";

-- AlterTable
ALTER TABLE "Avaliacao" ADD COLUMN     "atualizadoEm" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "texto" TEXT;

-- AlterTable
ALTER TABLE "Banimento" ADD COLUMN     "atualizadoEm" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Comentario" ADD COLUMN     "atualizadoEm" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "ComentarioLike" ADD COLUMN     "atualizadoEm" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Emprestimo" ADD COLUMN     "atualizadoEm" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "ExemplarLivro" ADD COLUMN     "atualizadoEm" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "FilaEspera" ADD COLUMN     "atualizadoEm" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Livro" ADD COLUMN     "anoPublicacao" INTEGER,
ADD COLUMN     "ativo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "atualizadoEm" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "editora" TEXT,
ADD COLUMN     "idioma" TEXT,
ADD COLUMN     "paginas" INTEGER;

-- AlterTable
ALTER TABLE "Multa" ADD COLUMN     "atualizadoEm" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "atualizadoEm" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "atualizadoEm" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "excluido" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Configuracao" (
    "id" TEXT NOT NULL,
    "chave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "descricao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Configuracao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "entidadeId" TEXT,
    "detalhes" JSONB,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Configuracao_chave_key" ON "Configuracao"("chave");

-- CreateIndex
CREATE INDEX "Emprestimo_usuarioId_idx" ON "Emprestimo"("usuarioId");

-- CreateIndex
CREATE INDEX "Emprestimo_status_idx" ON "Emprestimo"("status");

-- CreateIndex
CREATE INDEX "ExemplarLivro_livroId_idx" ON "ExemplarLivro"("livroId");

-- CreateIndex
CREATE INDEX "ExemplarLivro_status_idx" ON "ExemplarLivro"("status");

-- CreateIndex
CREATE INDEX "Livro_titulo_idx" ON "Livro"("titulo");

-- CreateIndex
CREATE INDEX "Livro_categoria_idx" ON "Livro"("categoria");

-- CreateIndex
CREATE INDEX "Multa_usuarioId_idx" ON "Multa"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_refreshToken_key" ON "Session"("refreshToken");

-- AddForeignKey
ALTER TABLE "Comentario" ADD CONSTRAINT "Comentario_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Comentario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComentarioLike" ADD CONSTRAINT "ComentarioLike_comentarioId_fkey" FOREIGN KEY ("comentarioId") REFERENCES "Comentario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
