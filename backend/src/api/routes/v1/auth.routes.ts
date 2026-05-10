import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { validate } from "../../middlewares/validate.middleware.js";
import { createAuthMiddleware, type AuthRequest } from "../../middlewares/auth.middleware.js";
import { signUpSchema } from "@/application/use-cases/auth/sign-up/sign-up.request.js";
import { signInSchema } from "@/application/use-cases/auth/sign-in/sign-in.request.js";
import type { Container } from "../../container.js";

export function authRouter(container: Container): Router {
  const router = Router();
  const auth = createAuthMiddleware(container.tokenIssuer);

  router.post("/sign-up", validate(signUpSchema), async (req: Request, res: Response, next: NextFunction) => {
    const result = await container.signUpUseCase.execute(req.body);
    if (!result.ok) { next(result.error); return; }
    res.status(201).json(result.value);
  });

  router.post("/sign-in", validate(signInSchema), async (req: Request, res: Response, next: NextFunction) => {
    const result = await container.signInUseCase.execute(req.body);
    if (!result.ok) { next(result.error); return; }
    res.status(200).json(result.value);
  });

  router.get("/me", auth, (req: Request, res: Response) => {
    const { sub, name, role } = (req as AuthRequest).user;
    res.json({ id: sub, name, role });
  });

  return router;
}
