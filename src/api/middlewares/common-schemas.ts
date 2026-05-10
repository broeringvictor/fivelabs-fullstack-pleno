import { string, object } from "yup";

export const uuidSchema = string().uuid().required();

export const idParamSchema = object({
  id: uuidSchema,
});
