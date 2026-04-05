/*
  Warnings:

  - You are about to drop the column `livroId` on the `Emprestimo` table. All the data in the column will be lost.
  - You are about to drop the column `quantidadeDisponivel` on the `Livro` table. All the data in the column will be lost.
  - You are about to drop the column `quantidadeTotal` on the `Livro` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Livro` table. All the data in the column will be lost.
  - Added the required column `exemplarId` to the `Emprestimo` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "StatusExemplar" AS ENUM ('DISPONIVEL', 'EMPRESTADO', 'INDISPONIVEL');

-- DropForeignKey
ALTER TABLE "Emprestimo" DROP CONSTRAINT "Emprestimo_livroId_fkey";

-- AlterTable
ALTER TABLE "Emprestimo" DROP COLUMN "livroId",
ADD COLUMN     "exemplarId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Livro" DROP COLUMN "quantidadeDisponivel",
DROP COLUMN "quantidadeTotal",
DROP COLUMN "status";

-- DropEnum
DROP TYPE "StatusLivro";

-- CreateTable
CREATE TABLE "ExemplarLivro" (
    "id" TEXT NOT NULL,
    "livroId" TEXT NOT NULL,
    "numeroTombo" TEXT NOT NULL,
    "status" "StatusExemplar" NOT NULL DEFAULT 'DISPONIVEL',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExemplarLivro_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExemplarLivro_numeroTombo_key" ON "ExemplarLivro"("numeroTombo");

-- AddForeignKey
ALTER TABLE "ExemplarLivro" ADD CONSTRAINT "ExemplarLivro_livroId_fkey" FOREIGN KEY ("livroId") REFERENCES "Livro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Emprestimo" ADD CONSTRAINT "Emprestimo_exemplarId_fkey" FOREIGN KEY ("exemplarId") REFERENCES "ExemplarLivro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
