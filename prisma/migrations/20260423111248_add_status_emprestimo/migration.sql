-- AlterEnum
ALTER TYPE "StatusEmprestimo" ADD VALUE 'AGUARDANDO_ENTREGA';

-- AlterTable
ALTER TABLE "Emprestimo" ADD COLUMN     "dataLimiteRetirada" TIMESTAMP(3);
