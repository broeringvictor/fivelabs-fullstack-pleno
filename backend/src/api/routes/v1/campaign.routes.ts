import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { validate } from "../../middlewares/validate.middleware.js";
import { idParamSchema } from "../../middlewares/common-schemas.js";
import { createAuthMiddleware, type AuthRequest } from "../../middlewares/auth.middleware.js";
import { createCampaignSchema } from "@/application/use-cases/campaign/create-campaign/create-campaign.request.js";
import { updateCampaignSchema } from "@/application/use-cases/campaign/update-campaign/update-campaign.request.js";
import type { Container } from "../../container.js";

export function campaignRouter(container: Container): Router {
  const router = Router();
  const auth = createAuthMiddleware(container.tokenIssuer);

  router.post("/", auth, validate(createCampaignSchema), async (req: Request, res: Response, next: NextFunction) => {
    const result = await container.createCampaignUseCase.execute({
      ...req.body,
      createdById: (req as AuthRequest).user.sub,
    });
    if (!result.ok) { next(result.error); return; }
    res.status(201).json(result.value);
  });

  router.get("/", auth, async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const campaigns = await container.listCampaignsUseCase.execute();
      res.json(campaigns);
    } catch (e) { next(e); }
  });

  router.patch("/:id", auth, validate({ params: idParamSchema, body: updateCampaignSchema }), async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params["id"] as string;
    const result = await container.updateCampaignUseCase.execute(id, req.body);
    if (!result.ok) { next(result.error); return; }
    res.json(result.value);
  });

  return router;
}
