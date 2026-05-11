import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import { authRouter } from "./v1/auth.routes.js";
import { campaignRouter } from "./v1/campaign.routes.js";
import { goalRouter } from "./v1/goal.routes.js";
import { appraisalRouter } from "./v1/appraisal.routes.js";
import { reportRouter } from "./v1/report.routes.js";
import { salespersonRouter } from "./v1/salesperson.routes.js";
import { openApiSpec } from "../docs/openapi.js";
import type { Container } from "../container.js";

export function createRouter(container: Container): Router {
  const router = Router();

  // Redirect na raiz para a documentação
  router.get("/", (req, res) => {
    res.redirect("/api/v1/docs");
  });

  // Rotas v1
  const v1Router = Router();
  v1Router.use("/auth", authRouter(container));
  v1Router.use("/campaigns", campaignRouter(container));
  v1Router.use("/goals", goalRouter(container));
  v1Router.use("/appraisals", appraisalRouter(container));
  v1Router.use("/reports", reportRouter(container));
  v1Router.use("/salespersons", salespersonRouter(container));

  router.use("/v1", v1Router);

  // Swagger UI em v1/docs
  router.use("/v1/docs", swaggerUi.serve);
  router.get("/v1/docs", swaggerUi.setup(openApiSpec));

  return router;
}
