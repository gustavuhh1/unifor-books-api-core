import Fastify from "fastify";
import { usersRoutes } from "./modules/users/users.routes";
import { authRoutes } from "./modules/auth/auth.routes";

const app = Fastify({
  logger: process.env.NODE_ENV === "development",
});

app.register(usersRoutes);
app.register(authRoutes);

export default app;
