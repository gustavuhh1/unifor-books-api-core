# Arquitetura do Ecossistema — Biblioteca Digital UNIFOR

## Visão Geral

O projeto consiste em um ecossistema digital para suprir a ausência de uma ferramenta portátil de conexão entre alunos e a biblioteca da UNIFOR. O sistema permite que estudantes consultem acervos, solicitem empréstimos, acompanhem devoluções e interajam com a comunidade de leitores, sem necessidade de presença física. Bibliotecários têm acesso a um painel administrativo integrado ao mesmo aplicativo mobile para moderação e gestão.

**Disciplinas contempladas:** Integração de Sistemas + Desenvolvimento Mobile  
**Plataforma mobile:** Android (Kotlin)  
**Ambiente de execução:** Local via Docker  

***

## Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────────┐
│                        ECOSSISTEMA UNIFOR BIBLIOTECA            │
│                                                                 │
│   ┌─────────────────┐         ┌──────────────────────────┐      │
│   │   Mobile App    │◄───────►│    Core API (Fastify)    │      │
│   │   (Kotlin/      │  REST   │    Node.js — Porta 3333  │      │
│   │    Android)     │  JWT    │                          │      │
│   └─────────────────┘         │  - Autenticação JWT      │      │
│                               │  - Catálogo/Acervo       │      │
│                               │  - Empréstimos/Devoluções│      │
│                               │  - Multas                │      │
│                               │  - Likes/Comentários     │      │
│                               │  - Moderação (Admin)     │      │
│                               └──────────┬───────────────┘      │
│                                          │                      │
│                               ┌──────────▼───────────────┐      │
│                               │      PostgreSQL(Docker)  │      │
│                               │      Porta 5432          │      │
│                               └──────────────────────────┘      │
│                                          │                      │
│                               ┌──────────▼───────────────┐      │
│                               │      RabbitMQ            │      │
│                               │      Porta 5672          │      │
│                               │                          │      │
│                               │  Filas:                  │      │
│                               │  - fila.comentarios      │      │
│                               │  - fila.likes            │      │
│                               │  - fila.emprestimo.fila  │      │
│                               └──────────┬───────────────┘      │
│                                          │                      │
│                               ┌──────────▼────────────────┐     │
│                               │   Serviço de Métricas     │     │
│                               │   Node.js — Porta 3001    │     │
│                               │                           │     │
│                               │  - Livros mais avaliados  │     │
│                               │  - Livros mais emprestados│     │
│                               │  - Análise por categoria  │     │
│                               └───────────────────────────┘     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

***

## Serviço 1 — Core API (Back-end Principal)

### Identificação

| Atributo | Valor |
|---|---|
| **Tecnologia** | Node.js + Fastify |
| **Linguagem** | TypeScript |
| **Banco de dados** | PostgreSQL |
| **Mensageria** | RabbitMQ (produtor e consumidor) |
| **Autenticação** | JWT (Access Token + Refresh Token) |
| **Porta** | 3000 |
| **Repositório sugerido** | `unifor-biblioteca-api` |

### Para que serve?

É o cérebro do ecossistema. Centraliza toda a lógica de negócio da plataforma: autenticação de usuários, gestão do acervo bibliográfico, fluxo de empréstimos e devoluções, cálculo e gerenciamento de multas, sistema de interação social (avaliações, comentários, likes) e moderação de conteúdo por bibliotecários.

### Módulos e Responsabilidades

#### Módulo: Autenticação (`/auth`)
- `POST /auth/login` — Recebe matrícula + senha, valida no banco, retorna JWT (access token de curta duração + refresh token)
- `POST /auth/refresh` — Renova o access token com o refresh token
- `POST /auth/logout` — Invalida o refresh token
- Middleware de autenticação JWT aplicado em todas as rotas protegidas
- Middleware de autorização por papel: `ROLE_ALUNO`, `ROLE_ADMIN`

#### Módulo: Acervo (`/books`)
- `GET /books` — Lista o catálogo com filtros (título, autor, categoria, disponibilidade, ordenação por avaliação)
- `GET /books/:id` — Detalhes de um livro (capa, sinopse, ISBN, autor, status de disponibilidade, média de avaliação, total de avaliações)
- `POST /books` *(Admin)* — Cadastra novo livro no acervo
- `PATCH /books/:id/status` *(Admin)* — Altera status do livro: `DISPONIVEL` | `INDISPONIVEL`
- `PUT /books/:id` *(Admin)* — Edita informações do livro

#### Módulo: Avaliações (`/books/:id/ratings`)
- `POST /books/:id/ratings` — Aluno avalia um livro (0.5 a 10.0, incrementos de 0.5)
- `GET /books/:id/ratings` — Retorna avaliação do aluno autenticado e média geral
- `PUT /books/:id/ratings` — Aluno atualiza sua avaliação (um voto por aluno por livro)
- Regra: apenas alunos que já devolveram o livro podem avaliar (valida histórico de empréstimos)

#### Módulo: Comentários (`/books/:id/comments`)
- `POST /books/:id/comments` — Aluno publica comentário; a publicação **produz mensagem** na `fila.comentarios` do RabbitMQ
- `GET /books/:id/comments` — Lista comentários do livro (paginados), com contagem de likes e respostas
- `POST /books/:id/comments/:commentId/replies` — Aluno responde a um comentário (também via fila)
- `DELETE /comments/:commentId` *(Admin)* — Moderação: remove comentário
- Consumidor da fila: persiste comentários/respostas no banco de forma assíncrona

#### Módulo: Likes (`/comments/:id/likes`)
- `POST /comments/:id/likes` — Aluno dá like em um comentário; **produz mensagem** na `fila.likes`
- `DELETE /comments/:id/likes` — Remove like
- Consumidor da fila: persiste o like e pode futuramente disparar notificação ao autor

#### Módulo: Empréstimos (`/loans`)
- `POST /loans/request` — Aluno solicita empréstimo de um livro
  - Se livro `DISPONIVEL` → cria empréstimo com status `PENDENTE`
  - Se livro `INDISPONIVEL` e aluno aceitar fila → **produz mensagem** na `fila.emprestimo.fila` com posição
  - Regra: aluno não pode ter empréstimos em atraso para solicitar novo
- `GET /loans/my` — Aluno consulta seus empréstimos (ativos, pendentes, histórico)
- `GET /loans` *(Admin)* — Lista todos os empréstimos com filtros de status
- `PATCH /loans/:id/approve` *(Admin)* — Aprova empréstimo → status `ATIVO`, define `data_devolucao`
- `PATCH /loans/:id/deny` *(Admin)* — Nega empréstimo com motivo obrigatório → status `NEGADO`
- `PATCH /loans/:id/return` *(Admin)* — Registra devolução → status `DEVOLVIDO`, calcula multa se atrasado
- Consumidor da fila de empréstimos: processa a fila de espera quando um livro é devolvido

#### Módulo: Multas (`/fines`)
- `GET /fines/my` — Aluno consulta multas acumuladas e valor total
- `GET /fines` *(Admin)* — Lista multas de todos os alunos
- `PATCH /fines/:id/pay` *(Admin)* — Registra pagamento de multa
- Regra de cálculo: R$ X por dia de atraso (valor configurável via variável de ambiente)
- Bloqueio automático: aluno com multa não paga não pode solicitar novos empréstimos

#### Módulo: Usuários/Moderação (`/users`)
- `GET /users` *(Admin)* — Lista usuários com filtros
- `GET /users/:id` *(Admin)* — Perfil completo do aluno
- `POST /users/:id/ban` *(Admin)* — Bane usuário com duração (em dias) ou permanentemente
- `DELETE /users/:id/ban` *(Admin)* — Remove banimento
- Middleware de verificação de banimento em todas as ações de escrita do aluno

### Estrutura de Pastas Sugerida

```
unifor-biblioteca-api/
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.schema.ts
│   │   ├── books/
│   │   ├── loans/
│   │   ├── fines/
│   │   ├── comments/
│   │   ├── likes/
│   │   └── users/
│   ├── shared/
│   │   ├── middlewares/      # JWT, roles, ban check
│   │   ├── rabbitmq/         # Produtor e consumidores
│   │   ├── database/         # Conexão PostgreSQL (Prisma ou Drizzle)
│   │   └── utils/
│   ├── app.ts                # Instância do Fastify + plugins
│   └── server.ts             # Entry point
├── docker-compose.yml
├── .env.example
└── package.json
```

### ORM Recomendado

**Prisma ORM** — Gera tipos TypeScript automaticamente a partir do schema, excelente DX, migrations automáticas, e tem ótima integração com PostgreSQL. Alternativa moderna: **Drizzle ORM** (mais leve e "SQL-first").

***

## Serviço 2 — Serviço de Métricas

### Identificação

| Atributo | Valor |
|---|---|
| **Tecnologia** | Node.js + Fastify |
| **Linguagem** | TypeScript |
| **Fonte de dados** | PostgreSQL (mesmo banco, schema separado ou views) |
| **Comunicação** | REST (consumido pelo Mobile e futuramente por um dashboard web) |
| **Porta** | 3001 |
| **Repositório sugerido** | `unifor-biblioteca-metrics` |

### Para que serve?

Serviço independente responsável por agregar e expor dados analíticos do ecossistema. Consome as mesmas tabelas do PostgreSQL (via queries de agregação) para produzir métricas sobre o comportamento de uso da biblioteca. A separação em microsserviço garante que queries pesadas de análise não impactem a performance da Core API.

### Endpoints

| Endpoint | Descrição |
|---|---|
| `GET /metrics/books/top-rated` | Top livros por média de avaliação (filtro por categoria) |
| `GET /metrics/books/most-borrowed` | Livros mais emprestados (período configurável) |
| `GET /metrics/books/most-commented` | Livros com mais engajamento (comentários + likes) |
| `GET /metrics/categories/top-rated` | Categorias melhor avaliadas em média |
| `GET /metrics/loans/overview` | Panorama geral: empréstimos ativos, pendentes, em atraso |
| `GET /metrics/fines/overview` | Total de multas pendentes e pagas |

### Estratégia de Performance

- Queries com `GROUP BY`, `AVG()`, `COUNT()` e `ORDER BY` no PostgreSQL
- Resultado cacheado em memória (simples Map com TTL de 5-10 minutos) para não sobrecarregar o banco a cada request
- Futuramente: materializar views no PostgreSQL para queries mais complexas

***

## Fila de Mensageria — RabbitMQ

### Para que serve?

Desacopla operações de alta frequência e menor criticidade temporal da resposta HTTP imediata. Garante que picos de interação (muitos likes/comentários simultâneos) não travem a API principal. Também gerencia a fila de espera de empréstimos de forma ordenada e resiliente.

### Filas Definidas

| Fila | Produtor | Consumidor | Descrição |
|---|---|---|---|
| `fila.comentarios` | Core API | Core API (worker) | Persiste comentários e respostas de forma assíncrona |
| `fila.likes` | Core API | Core API (worker) | Persiste likes e prepara base para notificações futuras |
| `fila.emprestimo.espera` | Core API | Core API (worker) | Gerencia fila de espera de livros em uso; notifica próximo da fila quando livro é devolvido |

### Justificativa Acadêmica

O uso de RabbitMQ demonstra, na prática, os conceitos de **integração de sistemas via mensageria assíncrona** (AMQP), padrão producer-consumer, e resiliência por persistência de mensagens. Isso atende diretamente ao escopo da cadeira de Integração de Sistemas.

***

## Banco de Dados — PostgreSQL

### Modelo de Entidades Principais

```
USERS
├── id (UUID)
├── matricula (UNIQUE)
├── nome
├── email
├── senha_hash
├── role (ALUNO | ADMIN)
├── banned_until (TIMESTAMP NULL)
├── banned_permanent (BOOLEAN)
└── created_at

BOOKS
├── id (UUID)
├── titulo
├── autor
├── isbn (UNIQUE)
├── sinopse
├── capa_url
├── categoria
├── status (DISPONIVEL | INDISPONIVEL)
├── quantidade_total
├── quantidade_disponivel
└── created_at

LOANS
├── id (UUID)
├── user_id → USERS
├── book_id → BOOKS
├── status (PENDENTE | ATIVO | DEVOLVIDO | NEGADO | CANCELADO)
├── motivo_negacao (TEXT NULL)
├── data_solicitacao
├── data_aprovacao
├── data_devolucao_prevista
├── data_devolucao_real
└── created_at

LOAN_QUEUE (fila de espera)
├── id (UUID)
├── user_id → USERS
├── book_id → BOOKS
├── posicao
├── status (AGUARDANDO | NOTIFICADO | EXPIRADO)
└── created_at

FINES
├── id (UUID)
├── loan_id → LOANS
├── user_id → USERS
├── valor_total (DECIMAL)
├── dias_atraso (INTEGER)
├── status (PENDENTE | PAGO)
├── data_pagamento (TIMESTAMP NULL)
└── created_at

RATINGS
├── id (UUID)
├── user_id → USERS
├── book_id → BOOKS
├── nota (DECIMAL 2,1) — 0.5 a 10.0
├── UNIQUE(user_id, book_id)
└── created_at

COMMENTS
├── id (UUID)
├── user_id → USERS
├── book_id → BOOKS
├── parent_id → COMMENTS NULL (respostas)
├── conteudo (TEXT)
├── deletado (BOOLEAN)
└── created_at

COMMENT_LIKES
├── id (UUID)
├── user_id → USERS
├── comment_id → COMMENTS
├── UNIQUE(user_id, comment_id)
└── created_at

USER_BANS (histórico de banimentos)
├── id (UUID)
├── user_id → USERS
├── admin_id → USERS
├── motivo
├── banned_until (TIMESTAMP NULL)
├── permanente (BOOLEAN)
└── created_at
```

***

## Serviço 3 — Aplicativo Mobile (Android/Kotlin)

### Identificação

| Atributo | Valor |
|---|---|
| **Tecnologia** | Kotlin + Jetpack Compose |
| **Arquitetura** | MVVM + Clean Architecture (simplificada) |
| **Comunicação** | Retrofit 2 + OkHttp (REST com Core API e Métricas API) |
| **Injeção de dependência** | Hilt |
| **Navegação** | Navigation Component (Compose) |
| **Armazenamento local** | DataStore (tokens JWT) |
| **Repositório sugerido** | `unifor-biblioteca-app` |

### Para que serve?

Interface portátil que conecta alunos e bibliotecários ao ecossistema da biblioteca. Permite que o aluno realize todas as operações sem presença física: consultar acervo, solicitar empréstimos, interagir com a comunidade e monitorar multas. O bibliotecário usa o mesmo app com uma interface de administração desbloqueada pelo papel `ADMIN` no token JWT.

### Telas e Fluxos

#### Fluxo de Autenticação
- **SplashScreen** — Verifica se token JWT válido está no DataStore; redireciona para Home ou Login
- **LoginScreen** — Campo matrícula + senha; chama `POST /auth/login`; armazena tokens no DataStore; detecta papel e direciona para área correta (Aluno ou Admin)

#### Área do Aluno

| Tela | Funcionalidade |
|---|---|
| **HomeScreen** | Feed de destaques: livros mais bem avaliados, mais emprestados (dados do Serviço de Métricas) |
| **CatálogoScreen** | Lista paginada do acervo com busca e filtros; badge de disponibilidade; ordenação por avaliação |
| **DetalheDoLivroScreen** | Capa, sinopse, autor, status, média de estrelas, botão de solicitar empréstimo, seção de avaliação |
| **ComunidadeDoLivroScreen** | Lista de comentários, campo para comentar, botão de like, expansão de respostas |
| **MeusEmpréstimosScreen** | Lista de empréstimos ativos e pendentes com data de devolução e status |
| **HistóricoScreen** | Empréstimos concluídos e negados com motivo |
| **MultasScreen** | Valor acumulado de multas e detalhamento por empréstimo |
| **PerfilScreen** | Dados do aluno, status de conta (banido/ativo) |

#### Área do Admin (Bibliotecário)

| Tela | Funcionalidade |
|---|---|
| **AdminDashboardScreen** | Métricas rápidas: pendentes, em atraso, multas abertas (dados do Serviço de Métricas) |
| **GerenciarEmpréstimosScreen** | Lista de empréstimos pendentes com ações de Aprovar / Negar (com campo de motivo) |
| **GerenciarDevolucõesScreen** | Empréstimos ativos com ação de registrar devolução |
| **GerenciarMultasScreen** | Lista de multas com ação de registrar pagamento |
| **GerenciarAcervoScreen** | Lista de livros com ação de alterar status (Disponível/Indisponível), editar e adicionar |
| **ModeracaoComentariosScreen** | Lista de comentários reportados com ação de remover |
| **GerenciarUsuariosScreen** | Lista de alunos com ação de banir (duração/permanente) e remoção de ban |

### Estrutura de Pastas Sugerida

```
unifor-biblioteca-app/
├── app/src/main/java/br/unifor/biblioteca/
│   ├── data/
│   │   ├── remote/
│   │   │   ├── api/          # Interfaces Retrofit (CoreApi, MetricsApi)
│   │   │   └── dto/          # Data Transfer Objects
│   │   ├── local/            # DataStore (tokens)
│   │   └── repository/       # Implementações dos repositórios
│   ├── domain/
│   │   ├── model/            # Entidades de domínio
│   │   ├── repository/       # Interfaces dos repositórios
│   │   └── usecase/          # Casos de uso
│   ├── presentation/
│   │   ├── auth/
│   │   ├── catalog/
│   │   ├── loans/
│   │   ├── community/
│   │   ├── fines/
│   │   └── admin/
│   ├── core/
│   │   ├── di/               # Módulos Hilt
│   │   ├── navigation/       # NavGraph Compose
│   │   └── network/          # OkHttp interceptors (JWT inject, refresh)
│   └── MainActivity.kt
```

### Gestão de Token JWT no Mobile

- **Access Token** (curta duração: 15 min) → armazenado em DataStore Preferences com criptografia (EncryptedDataStore)
- **Refresh Token** (longa duração: 7 dias) → mesmo DataStore
- **OkHttp Interceptor** (`AuthInterceptor`) injeta automaticamente o `Authorization: Bearer <token>` em todas as requisições
- **Authenticator do OkHttp** detecta resposta `401`, chama silenciosamente `POST /auth/refresh` e reexecuta a requisição — transparente para o usuário

***

## Docker — Ambiente Local

### docker-compose.yml (raiz do projeto ou repositório de infra)

```yaml
version: '3.8'

services:
  postgres:
    image: bitnami/postgresql@sha256:c30c796dcf96a67a405b905bf6aaf8d6c957d5c2fe729db6e67e2760e21fd9f8
    container_name: unifor-books-postgres
    ports:
      - "5432:5432"
    environment:
      POSTGRESQL_USERNAME: biblioteca
      POSTGRESQL_PASSWORD: biblioteca123
      POSTGRESQL_DATABASE: unifor_books
    volumes:
      - postgres_data:/bitnami/postgresql

  rabbitmq:
    image: rabbitmq:3-management-alpine
    ports:
      - "5672:5672"    # AMQP
      - "15672:15672"  # Management UI (http://localhost:15672)
    environment:
      RABBITMQ_DEFAULT_USER: guest
      RABBITMQ_DEFAULT_PASS: guest

  core-api:
    build: ./unifor-biblioteca-api
    ports:
      - "3333:3333"
    environment:
      DATABASE_URL: postgresql://biblioteca:biblioteca123@postgres:5432/biblioteca_db
      RABBITMQ_URL: amqp://guest:guest@rabbitmq:5672
      JWT_SECRET: your_jwt_secret_here
      JWT_EXPIRES_IN: 15m
      JWT_REFRESH_EXPIRES_IN: 7d
      FINE_VALUE_PER_DAY: 2.00
    depends_on:
      - postgres
      - rabbitmq

  metrics-service:
    build: ./unifor-biblioteca-metrics
    ports:
      - "3001:3001"
    environment:
      DATABASE_URL: postgresql://biblioteca:biblioteca123@postgres:5432/biblioteca_db
    depends_on:
      - postgres

volumes:
  pgdata:
```

***

## Divisão de Repositórios

| Repositório | Tecnologia | Responsabilidade |
|---|---|---|
| `unifor-biblioteca-api` | Node.js + Fastify + TypeScript | Core API — toda a lógica de negócio principal |
| `unifor-biblioteca-metrics` | Node.js + Fastify + TypeScript | Serviço de métricas e análises |
| `unifor-biblioteca-app` | Kotlin + Jetpack Compose | Aplicativo Android |
| `unifor-biblioteca-infra` | Docker Compose | Orquestração local dos serviços (opcional) |

***

## Ordem de Desenvolvimento Sugerida

### Fase 1 — Fundação (Back-end Core)
1. Configurar projeto Node.js + Fastify + TypeScript
2. Docker Compose com PostgreSQL e RabbitMQ
3. Modelagem do banco com Prisma (schema + migrations)
4. Módulo de Autenticação (login, JWT, refresh, middleware)
5. Módulo de Acervo (CRUD básico de livros, status)
6. Módulo de Empréstimos (solicitação, aprovação, negação, devolução)
7. Módulo de Multas (cálculo automático, listagem)
8. Integração RabbitMQ: filas de comentários/likes e fila de espera de empréstimos
9. Módulo de Comentários e Likes (com RabbitMQ)
10. Módulo de Avaliações por estrelas
11. Módulo de Moderação (banimento, remoção de comentários)

### Fase 2 — Métricas
12. Criar projeto `unifor-biblioteca-metrics`
13. Implementar endpoints de agregação com queries PostgreSQL
14. Adicionar cache em memória simples

### Fase 3 — Mobile
15. Configurar projeto Kotlin + Jetpack Compose + Hilt
16. Camada de rede: Retrofit + OkHttp + Interceptors JWT
17. Telas de Autenticação
18. Telas do Catálogo e Detalhe do Livro
19. Telas de Comunidade (comentários, likes, avaliações)
20. Telas de Empréstimos e Multas
21. Área Administrativa (todas as telas de gerenciamento)

***

## Resumo das Tecnologias

| Camada | Tecnologia | Versão recomendada |
|---|---|---|
| Core API | Node.js + Fastify + TypeScript | Node 20 LTS |
| ORM | Prisma ORM | v5+ |
| Banco de dados | PostgreSQL | v16 |
| Mensageria | RabbitMQ + amqplib | RabbitMQ 3 |
| Métricas | Node.js + Fastify | Node 20 LTS |
| Mobile | Kotlin + Jetpack Compose | Kotlin 2.0 |
| HTTP Client (Mobile) | Retrofit 2 + OkHttp | Retrofit 2.11 |
| DI (Mobile) | Hilt | 2.51 |
| Navegação (Mobile) | Navigation Compose | 2.8+ |
| Armazenamento (Mobile) | DataStore Preferences | 1.1+ |
| Containerização | Docker + Docker Compose | Compose v2 |
