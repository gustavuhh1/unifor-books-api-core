import { z } from 'zod'

export const criarUsuarioSchema = z.object({
  matricula: z.string().min(1),
  nome: z.string().min(1),
  email: z.string().email(),
  senha: z.string().min(6),
  role: z.enum(['ALUNO', 'ADMIN']).default('ALUNO'),
})

export type CriarUsuarioInput = z.infer<typeof criarUsuarioSchema>