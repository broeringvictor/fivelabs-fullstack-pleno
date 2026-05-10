import { object, string } from "yup";

export const signInSchema = object({
  email: string().email().required().lowercase(),
  password: string().required(),
});

export type SignInRequest = {
  email: string;
  password: string;
};
