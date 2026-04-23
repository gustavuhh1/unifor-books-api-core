import Fastify from "fastify";
import { usersRoutes } from "./modules/users/users.routes";
import { authRoutes } from "./modules/auth/auth.routes";
import { booksRoutes } from "./modules/books/books.routes";
import { loansRoutes } from "./modules/emprestimos/loans.routes";
import { finesRoutes } from "./modules/multas/fines.routes";

import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";

const app = Fastify({
  logger: process.env.NODE_ENV === "development",
});

app.register(fastifySwagger, {
  openapi: {
    info: {
      title: "Unifor Books API",
      description: "API Core do Ecossistema Biblioteca Digital UNIFOR",
      version: "1.0.0",
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
});

app.register(fastifySwaggerUi, {
  routePrefix: "/docs",
  uiConfig: {
    docExpansion: "list",
    deepLinking: false,
  },
});

// É importante registrar o Swagger ANTES das rotas!
app.register(usersRoutes);
app.register(authRoutes);
app.register(booksRoutes);
app.register(loansRoutes);
app.register(finesRoutes);

export default app;
