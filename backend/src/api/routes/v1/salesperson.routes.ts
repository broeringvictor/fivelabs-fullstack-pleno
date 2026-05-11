import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { createAuthMiddleware } from "../../middlewares/auth.middleware.js";
import type { Container } from "../../container.js";

export function salespersonRouter(container: Container): Router {
  const router = Router();
  const auth = createAuthMiddleware(container.tokenIssuer);

  router.get("/", auth, async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await container.listSalespersonsUseCase.execute();
      res.json(result);
    } catch (e) { next(e); }
  });

  return router;
}
