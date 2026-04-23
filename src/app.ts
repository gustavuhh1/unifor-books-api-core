import Fastify from "fastify";
import { usersRoutes } from "./modules/users/users.routes";
import { authRoutes } from "./modules/auth/auth.routes";
import { booksRoutes } from "./modules/books/books.routes";

const app = Fastify({
  logger: process.env.NODE_ENV === "development",
});

app.register(usersRoutes);
app.register(authRoutes);
app.register(booksRoutes);

export default app;
