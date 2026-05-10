import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { createAuthMiddleware, type AuthRequest } from "../../middlewares/auth.middleware.js";
import type { Container } from "../../container.js";

export function appraisalRouter(container: Container): Router {
  const router = Router();
  const auth = createAuthMiddleware(container.tokenIssuer);

  router.post("/", auth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const triggeredById = (req as AuthRequest).user.sub;
      const result = await container.triggerAppraisalUseCase.execute(triggeredById);
      res.status(202).json(result);
    } catch (e) { next(e); }
  });

  router.get("/:id", auth, async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params["id"];
    if (typeof id !== "string") { res.status(400).json({ error: "Missing appraisal id" }); return; }
    const result = await container.getAppraisalUseCase.execute(id);
    if (!result.ok) { next(result.error); return; }
    res.json(result.value);
  });

  return router;
}
