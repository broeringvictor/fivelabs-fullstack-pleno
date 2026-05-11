import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { validate } from "../../middlewares/validate.middleware.js";
import { idParamSchema } from "../../middlewares/common-schemas.js";
import { createAuthMiddleware, type AuthRequest } from "../../middlewares/auth.middleware.js";
import type { Container } from "../../container.js";

export function appraisalRouter(container: Container): Router {
  const router = Router();
  const auth = createAuthMiddleware(container.tokenIssuer);

  router.get("/", auth, async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await container.listAppraisalsUseCase.execute();
      res.json(result);
    } catch (e) { next(e); }
  });

  router.post("/", auth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const triggeredById = (req as AuthRequest).user.sub;
      const result = await container.triggerAppraisalUseCase.execute(triggeredById);
      res.status(202).json(result);
    } catch (e) { next(e); }
  });

  router.get("/:id", auth, validate({ params: idParamSchema }), async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params["id"] as string;
    const result = await container.getAppraisalUseCase.execute(id);
    if (!result.ok) { next(result.error); return; }
    res.json(result.value);
  });

  return router;
}
