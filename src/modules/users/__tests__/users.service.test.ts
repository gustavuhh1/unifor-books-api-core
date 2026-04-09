import { describe, it, expect } from "vitest";
import { prismaMock } from "../../../__mocks__/prisma";
import { criarUsuario, listarUsuarios } from "../users.service";

describe("Historia: Cadastro de usuário", () => {
  it("dado que um novo aluno preenche o formulário com dados válidos, ele deve conseguir se cadastrar", async () => {
    prismaMock.usuario.create.mockResolvedValue({
      id: "uuid-1",
      matricula: "2024001",
      nome: "João Silva",
      email: "joao.silva@unifor.br",
      senhaHash: "hash",
      role: "ALUNO",
      banidoAte: null,
      banidoPermanente: false,
      criadoEm: new Date(),
    });

    const result = await criarUsuario({
      matricula: "2024001",
      nome: "João Silva",
      email: "joao.silva@unifor.br",
      senha: "senha123",
      role: "ALUNO",
    });

    expect(result).toMatchObject({
      matricula: "2024001",
      nome: "João Silva",
      email: "joao.silva@unifor.br",
      role: "ALUNO",
    });
  });

  it("dado que o aluno tenta se cadastrar com uma matrícula já existente, ele deve receber um erro", async () => {
    prismaMock.usuario.create.mockRejectedValue(new Error("Matrícula já cadastrada"));

    await expect(
      criarUsuario({
        matricula: "2024001",
        nome: "João Silva",
        email: "joao.silva@unifor.br",
        senha: "senha123",
        role: "ALUNO",
      }),
    ).rejects.toThrow("Matrícula já cadastrada");
  });

  it("dado que o cadastro foi bem sucedido, a senha não deve aparecer na resposta", async () => {
    prismaMock.usuario.create.mockResolvedValue({
      id: "uuid-1",
      matricula: "2024001",
      nome: "João Silva",
      email: "joao.silva@unifor.br",
      senhaHash: "hash",
      role: "ALUNO",
      banidoAte: null,
      banidoPermanente: false,
      criadoEm: new Date(),
    });

    const result = await criarUsuario({
      matricula: "2024001",
      nome: "João Silva",
      email: "joao.silva@unifor.br",
      senha: "senha123",
      role: "ALUNO",
    });

    expect(result).not.toHaveProperty("senha");
    expect(result).not.toHaveProperty("senhaHash");
  });

  it("listar usuários", async () => {
    prismaMock.usuario.findMany.mockResolvedValue([
      {
        id: "uuid-1",
        matricula: "2024001",
        nome: "João Silva",
        email: "joao.silva@unifor.br",
        senhaHash: "hash",
        role: "ALUNO",
        banidoAte: null,
        banidoPermanente: false,
        criadoEm: new Date(),
      },
    ]);

    const result = await listarUsuarios();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      matricula: "2024001",
      nome: "João Silva",
      email: "joao.silva@unifor.br",
      role: "ALUNO",
    });
  });
});
