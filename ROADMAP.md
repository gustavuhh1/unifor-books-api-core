# Roadmap de Desenvolvimento — Unifor Books API Core 🚀

Este documento detalha o fluxo passo a passo para o desenvolvimento completo do ecossistema, respeitando as dependências entre os módulos de negócio e a arquitetura *Modular (Feature-First)* escolhida para o projeto.

---

## ✅ FASE 0: Fundação (Concluída)

*A base sólida do projeto já foi estabelecida e validada.*

- [x] Setup do Node.js + Fastify + TypeScript.
- [x] Configuração do Docker Compose (PostgreSQL e RabbitMQ).
- [x] Modelagem do banco de dados com Prisma ORM (incluindo Auditoria, Soft Delete e Configurações).
- [x] Módulo de **Autenticação (`/auth`)** com JWT, Refresh Tokens "Stateful" (Sessões no banco) e Logout.
- [x] Módulo de **Acervo (`/books`)** com rotas robustas de Catálogo, paginação e cadastro de exemplares.

---

## 🟢 FASE 1: Módulo de Usuários (`/users`)

*Objetivo: Criar a base de alunos para podermos testar os empréstimos e engajamento.*

- **1. Rotas de Criação (`POST /users`):** Endpoint para cadastrar novos Alunos (criptografando a senha com `bcrypt`).
- **2. Rotas Administrativas (`GET /users` e `GET /users/:id`):** Listagem e visualização de perfis por parte dos Bibliotecários.

---

## 🟡 FASE 2: O Coração — Módulo de Empréstimos (`/loans`)

*Objetivo: Construir o motor principal da biblioteca.*

- **1. Solicitação (`POST /loans/request`):**
  - Validar se o aluno não tem multas não pagas.
  - Verificar se há exemplar `DISPONIVEL`.
  - Se houver, criar Empréstimo com status `PENDENTE`.
  - Se não houver, inserir o usuário na tabela `FilaEspera`.
- **2. Painel do Aluno (`GET /loans/my`):** Listar os empréstimos ativos, pendentes e o histórico do usuário logado.
- **3. Aprovação Admin (`PATCH /loans/:id/approve` e `/deny`):**
  - Bibliotecário aprova o pedido, mudando para `AGUARDANDO_ENTREGA` (Exemplar é separado e status muda para `EMPRESTADO`).
  - É gerada uma `dataLimiteRetirada` de 2 dias úteis.
  - Se negado, o status vai para `NEGADO` informando o motivo.
- **4. Entrega e Cancelamento Admin (`PATCH /loans/:id/entregar` e `/cancelar`):**
  - Se o aluno for buscar o livro: muda para `ATIVO` e gera a `dataDevolucaoPrevista` (14 dias).
  - Se o aluno não for buscar: muda para `CANCELADO` e devolve o exemplar para `DISPONIVEL`.
- **5. Renovação (`POST /loans/:id/renew`):**
  - Aluno renova por mais 14 dias se não houver fila de espera e não estiver em atraso.
- **6. Devolução (`PATCH /loans/:id/return`):**
  - Registrar a `dataDevolucaoReal`.
  - Mudar o status do Exemplar de volta para `DISPONIVEL`.
  - *Gatilho:* Se estiver atrasado, invocar a geração da Multa.

---

## 🟠 FASE 3: O Bolso — Módulo de Multas (`/fines`)

*Objetivo: Penalizar financeiramente os atrasos de forma automática.*

- **1. Configurações Globais:**
  - Substituir hardcodes (prazo de empréstimo, valor de multa) por consultas à tabela `Configuracao`.
- **2. Listagem de Multas (`GET /multas` e `GET /multas/minhas`):**
  - Admin vê todas as multas. Aluno vê apenas as suas.
- **3. Quitação Administrativa (`PATCH /multas/:id/quitar`):**
  - Rota para o Admin registrar que o aluno pagou a dívida no balcão da biblioteca.
- **4. Pagamento via App (`PATCH /multas/:id/pagar`):**
  - Rota inicial para o Aluno pagar do celular (Nesta fase, apenas criaremos a estrutura e retornaremos um "pagamento simulado").
- **5. Bloqueio Lógico (Concluído na Fase 2):**
  - Aluno com multa pendente falha na validação de criar novos empréstimos.

---

## 🔵 FASE 4: Integração de Sistemas — RabbitMQ

*Objetivo: Preparar o terreno para a mensageria assíncrona (Requisito Acadêmico).*

- **1. Conexão Base:** Criar na pasta `src/shared/rabbitmq` a classe/função de conexão (`amqplib`).
- **2. Inicialização:** Garantir que o `server.ts` estabeleça conexão com o RabbitMQ antes de subir as rotas.
- **3. Filas:** Declarar as filas `fila.comentarios` e `fila.likes` no startup.

---

## 🟣 FASE 5: Engajamento — Avaliações e Comentários

*Objetivo: Tornar a biblioteca uma comunidade.*

- **1. Avaliações Simples (`POST /books/:id/ratings`):**
  - Rota tradicional (HTTP Síncrono) para dar nota de 1 a 5.
  - *Regra de Negócio:* O aluno **só pode avaliar** um livro que já teve o status de empréstimo `DEVOLVIDO`.
- **2. Produtor de Comentários (`POST /books/:id/comments`):**
  - Rota para enviar um comentário sobre o livro.
  - Em vez de salvar no Prisma, a rota publica o payload JSON na `fila.comentarios` do RabbitMQ e retorna status `202 Accepted` para o usuário.
- **3. Produtor de Likes (`POST /comments/:id/likes`):**
  - Publica o like na `fila.likes`.

---

## 🟤 FASE 6: Os Consumidores (Workers)

*Objetivo: Processar os eventos disparados pela Fase 5.*

- **1. Worker de Comentários:** Um processo em background que escuta a `fila.comentarios` e faz o `prisma.comentario.create()`.
- **2. Worker de Likes:** Escuta a `fila.likes` e persiste no banco.
- **3. Notificador da Fila de Espera (Bônus):** Ao devolver um livro (Fase 2), disparar evento no RabbitMQ para que um Worker avise o próximo aluno da `FilaEspera` que o livro está disponível.

---

## ⚪ FASE 7: Serviço de Métricas (Novo Repositório)

*Objetivo: Desacoplar relatórios pesados da Core API.*

- **1. Setup:** Criar o novo projeto Fastify (`unifor-books-api-metrics`).
- **2. Conexão Read-Only:** Conectar ao mesmo PostgreSQL.
- **3. Dashboards:** Criar rotas pesadas com agrupamentos (`GROUP BY`, `AVG`, `COUNT`) para extrair os Top Livros, Livros mais Emprestados e volume de Multas.
- **4. Cache:** Implementar Redis ou Cache em Memória simples para não sobrecarregar o banco em cada request.

---

## 🛑 FASE 8: Moderação & Administração (Final)

*Objetivo: Criar as ferramentas de controle para os Bibliotecários (Admins) manterem a ordem na plataforma.*

- **1. Banimento de Usuários (`POST /users/:id/ban`):**
  - Criação da regra de negócio para banir usuário (temporário ou permanente).
  - Atualizar o campo `banidoAte` no perfil do usuário e registrar a ação na tabela `Banimento`.
- **2. Remoção de Banimento (`DELETE /users/:id/ban`):** Rota para perdoar um usuário antes do prazo.
- **3. Moderação de Comentários (`DELETE /comments/:id`):** Admin pode deletar (soft delete) comentários impróprios que os alunos fizeram na Fase 5.
- **4. Middlewares de Bloqueio Ativo:**
  - Atualizar os interceptadores (`authenticate.ts` / rotas) para checar a flag de banimento e bloquear ações de escrita (Empréstimos, Comentários, Avaliações) para usuários banidos.
- **5. Registro de Auditoria (Audit Log):**
  - Implementar lógica nos serviços para registrar na tabela `AuditLog` todas as ações críticas realizadas por Admins (como criar livros, banir alunos, perdoar multas e excluir comentários).

---

## 💸 FASE 9: Gateway de Pagamento (Integração Externa)

*Objetivo: Integrar um provedor real (ex: Stripe ou MercadoPago) para recebimento das multas diretamente pelo App.*

- **1. Setup do Gateway:** Configurar credenciais no `.env` e instalar SDK.
- **2. Rota de Checkout (`POST /multas/:id/checkout`):**
  - Substituir/Complementar a rota de pagar da Fase 3 para gerar um Link de Pagamento / PIX Copia e Cola.
- **3. Webhook de Confirmação (`POST /webhooks/payment`):**
  - Rota sem autenticação JWT (mas com verificação de assinatura do Gateway) para receber a notificação assíncrona de que o PIX/Cartão foi pago com sucesso.
  - O Worker ou a API atualiza a `Multa` para `PAGO` automaticamente, desbloqueando o aluno na hora.

---
*Gerado para a arquitetura do Unifor Books API Core.*
