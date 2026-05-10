import type { Request, Response, NextFunction } from "express";
import type { SignInUseCase } from "./sign-in.use-case.js";
import type { SignInRequest } from "./sign-in.request.js";

export class SignInController {
  constructor(private readonly useCase: SignInUseCase) {}

  handle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const result = await this.useCase.execute(req.body as SignInRequest);
    if (!result.ok) { next(result.error); return; }
    res.status(200).json(result.value);
  };
}
