import type { Request, Response, NextFunction } from "express";
import { ValidationError, type Schema } from "yup";

export function validate(schema: Schema) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.body = await schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });
      next();
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({ errors: error.errors });
        return;
      }
      next(error);
    }
  };
}
