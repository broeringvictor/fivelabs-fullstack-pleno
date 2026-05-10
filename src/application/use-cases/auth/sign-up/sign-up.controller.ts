import type { Request, Response, NextFunction } from "express";
import type { SignUpUseCase } from "./sign-up.use-case.js";
import type { SignUpRequest } from "./sign-up.request.js";

export class SignUpController {
  constructor(private readonly useCase: SignUpUseCase) {}

  handle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const result = await this.useCase.execute(req.body as SignUpRequest);
    if (!result.ok) { next(result.error); return; }
    res.status(201).json(result.value);
  };
}
