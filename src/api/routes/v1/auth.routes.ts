import { Router } from "express";
import { validate } from "../../middlewares/validate.middleware.js";
import { signUpSchema } from "@/application/use-cases/auth/sign-up/sign-up.request.js";
import { signInSchema } from "@/application/use-cases/auth/sign-in/sign-in.request.js";
import type { Container } from "../../container.js";

export function authRouter(container: Container): Router {
  const router = Router();
  router.post("/sign-up", validate(signUpSchema), container.signUpController.handle);
  router.post("/sign-in", validate(signInSchema), container.signInController.handle);
  return router;
}
