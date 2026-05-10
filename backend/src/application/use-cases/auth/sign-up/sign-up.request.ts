import { object, string } from "yup";

export const signUpSchema = object({
  name: string().required().trim().min(2).max(120),
  email: string().email().required().lowercase(),
  password: string().required().min(8),
});

export type SignUpRequest = {
  name: string;
  email: string;
  password: string;
};
