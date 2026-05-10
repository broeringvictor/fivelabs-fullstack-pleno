import express from "express";
import type { Request, Response, NextFunction } from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";

const app = express();
app.use(cors());
app.use(morgan("tiny"));
app.use(helmet());
app.use(express.json());
app.use((req: Request, res: Response, next: NextFunction) => {
    res.send("Hello World!");
})
export default app;