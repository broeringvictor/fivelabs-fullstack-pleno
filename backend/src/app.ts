import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import { createRouter } from "./api/routes/index.js";
import { container } from "./api/container.js";
import { errorHandler } from "./api/middlewares/error-handler.middleware.js";

const app = express();

app.use(cors({
  origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(morgan("tiny"));
app.use(helmet());
app.use(express.json());

// Disable cache for API routes to prevent 304 responses
app.use("/api", (req, res, next) => {
  res.set("Cache-Control", "no-cache, no-store, must-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  next();
});

app.use("/api", createRouter(container));

app.use(errorHandler);

export default app;
