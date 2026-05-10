import type { Request, Response, NextFunction } from "express";
import { ValidationError, type Schema } from "yup";

type ValidationSchemas = {
  body?: Schema<any>;
  params?: Schema<any>;
  query?: Schema<any>;
};

export function validate(schemas: ValidationSchemas | Schema<any>) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const targetSchemas: ValidationSchemas = 
        (schemas as any).body || (schemas as any).params || (schemas as any).query
          ? (schemas as ValidationSchemas)
          : { body: schemas as Schema<any> };

      if (targetSchemas.body) {
        req.body = await targetSchemas.body.validate(req.body, { abortEarly: false, stripUnknown: true });
      }
      if (targetSchemas.params) {
        req.params = await targetSchemas.params.validate(req.params as any, { abortEarly: false });
      }
      if (targetSchemas.query) {
        req.query = await targetSchemas.query.validate(req.query, { abortEarly: false });
      }

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
