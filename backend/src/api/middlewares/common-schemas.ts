import { string, object } from "yup";
import { validate as isUuid } from "uuid";

export const uuidSchema = string()
  .test("uuid", "deve ser um UUID válido", (v) => !v || isUuid(v))
  .required();

export const idParamSchema = object({
  id: uuidSchema,
});
