import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { createAuthMiddleware } from "../../middlewares/auth.middleware.js";
import type { Container } from "../../container.js";

export function reportRouter(container: Container): Router {
  const router = Router();
  const auth = createAuthMiddleware(container.tokenIssuer);

  router.get("/dashboard", auth, async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await container.getDashboardReportUseCase.execute();
      if (!result.ok) {
        next(result.error);
        return;
      }
      res.json(result.value);
    } catch (e) {
      next(e);
    }
  });

  return router;
}
