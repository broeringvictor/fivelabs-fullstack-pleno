import "dotenv/config";
import { object, string, number } from "yup";

const schema = object({
  DATABASE_URL: string().required(),
  JWT_SECRET: string().min(32).required(),
  JWT_EXPIRES_IN: string().default("7d"),
  PORT: number().default(3000),
  NODE_ENV: string().default("development"),
});

export const env = await schema.validate(process.env, {
  abortEarly: false,
  stripUnknown: true,
});

export type Env = typeof env;
