import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import { createRouter } from "./api/routes/index.js";
import { container } from "./api/container.js";
import { errorHandler } from "./api/middlewares/error-handler.middleware.js";

const app = express();

app.use(cors());
app.use(morgan("tiny"));
app.use(helmet());
app.use(express.json());

app.use("/api", createRouter(container));

app.use(errorHandler);

export default app;
