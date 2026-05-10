import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { object } from "yup";
import { validate } from "../../middlewares/validate.middleware.js";
import { uuidSchema } from "../../middlewares/common-schemas.js";
import { createAuthMiddleware } from "../../middlewares/auth.middleware.js";
import { createGoalSchema } from "@/application/use-cases/goal/create-goal/create-goal.request.js";
import type { Container } from "../../container.js";

const listGoalsSchema = object({
  query: object({
    campaignId: uuidSchema,
  }),
});

export function goalRouter(container: Container): Router {
  const router = Router();
  const auth = createAuthMiddleware(container.tokenIssuer);

  router.post("/", auth, validate(createGoalSchema), async (req: Request, res: Response, next: NextFunction) => {
    const result = await container.createGoalUseCase.execute(req.body);
    if (!result.ok) { next(result.error); return; }
    res.status(201).json(result.value);
  });

  router.get("/", auth, validate(listGoalsSchema), async (req: Request, res: Response, next: NextFunction) => {
    const { campaignId } = req.query as { campaignId: string };
    const result = await container.listGoalsUseCase.execute(campaignId);
    if (!result.ok) { next(result.error); return; }
    res.json(result.value);
  });

  return router;
}
