import Fastify from "fastify";
import { usersRoutes } from "./modules/users/users.routes";
import { authRoutes } from "./modules/auth/auth.routes";
import { authenticate,  } from "./shared/middlewares/authenticate";
import { authorize  } from "./shared/middlewares/authorize";

const app = Fastify({
  logger: true,
});

app.register(usersRoutes);
app.register(authRoutes);

app.get(
  "/teste/admin",
  {
    preHandler: [authenticate, authorize("ADMIN")],
  },
  async (request, reply) => {
    return reply.send({
      message: "Você é ADMIN!",
      user: request.user,
    });
  },
);

export default app;
