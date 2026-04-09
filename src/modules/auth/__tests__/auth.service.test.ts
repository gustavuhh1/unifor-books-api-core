import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prismaMock } from "../../../__mocks__/prisma";
import { login } from "../auth.service";
import { criarUsuario } from "@/modules/users/users.service";
import { hashSenha } from "@lib/hash";

describe("Historia: Login/Token de usuarios", () => {
  it("dado que um novo aluno preenche o formulário com dados válidos, ele deve conseguir se cadastrar", async () => {
    prismaMock.usuario.create.mockResolvedValue({
      id: "uuid-1",
      matricula: "2024009",
      nome: "João Silva",
      email: "joao.silva3@unifor.br",
      senhaHash: "hash",
      role: "ALUNO",
      banidoAte: null,
      banidoPermanente: false,
      criadoEm: new Date(),
    });

    const user = await criarUsuario({
      matricula: "2024009",
      nome: "João Silva",
      email: "joao.silva3@unifor.br",
      senha: "senha123",
      role: "ALUNO",
    });

    expect(user).toMatchObject({
      matricula: "2024009",
      nome: "João Silva",
      email: "joao.silva3@unifor.br",
      role: "ALUNO",
    });
  });
});
