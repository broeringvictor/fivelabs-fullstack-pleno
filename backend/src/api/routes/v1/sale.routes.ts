import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { createAuthMiddleware } from "../../middlewares/auth.middleware.js";
import type { Container } from "../../container.js";

export function saleRouter(container: Container): Router {
  const router = Router();
  const auth = createAuthMiddleware(container.tokenIssuer);

  router.post("/", auth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await container.createSaleUseCase.execute({
        salespersonId: req.body.salespersonId,
        productId: req.body.productId,
        regionId: req.body.regionId,
        amount: Number(req.body.amount),
        currency: req.body.currency || "BRL",
        soldAt: new Date(req.body.soldAt),
      });

      if (!result.ok) {
        return res.status(400).json({ error: result.error.message });
      }

      res.status(201).json({ success: true });
    } catch (e) {
      next(e);
    }
  });

  return router;
}

