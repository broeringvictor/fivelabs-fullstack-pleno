import { object, string, number, array, mixed, lazy } from "yup";
import { validate as isUuid } from "uuid";
import type { CompensationType } from "@/domain/enums/compensation-type.js";
import type { ConditionField } from "@/domain/enums/condition-field.js";
import type { ConditionOperator } from "@/domain/enums/condition-operator.js";
import type { LogicalOperator } from "@/domain/enums/logical-operator.js";

export type ConditionInput = {
  field: ConditionField;
  operator: ConditionOperator;
  value: unknown;
};

export type ConditionGroupInput = {
  logicalOperator: LogicalOperator;
  conditions: ConditionInput[];
  children: ConditionGroupInput[];
};

export type CreateGoalRequest = {
  campaignId: string;
  name: string;
  validFrom: string;
  validTo: string;
  compensationType: CompensationType;
  compensationValue: number;
  compensationCurrency?: string;
  conditionTree: ConditionGroupInput;
};

const conditionSchema = object({
  field: string().oneOf(["TOTAL_VALUE", "REGION", "PRODUCT", "SALESPERSON"]).required(),
  operator: string().oneOf(["EQ", "NEQ", "GT", "GTE", "LT", "LTE", "IN", "NOT_IN"]).required(),
  value: mixed().required(),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const conditionGroupSchema: any = object({
  logicalOperator: string().oneOf(["AND", "OR"]).required(),
  conditions: array().of(conditionSchema).required(),
  children: array().of(lazy(() => conditionGroupSchema as any)).required(),
});

export const createGoalSchema = object({
  campaignId: string().test("uuid", "deve ser um UUID válido", (v) => !v || isUuid(v)).required(),
  name: string().required().trim().min(2).max(200),
  validFrom: string().required(),
  validTo: string().required(),
  compensationType: string().oneOf(["FIXED", "PERCENTAGE"]).required(),
  compensationValue: number().required().min(0),
  compensationCurrency: string().length(3).uppercase().optional(),
  conditionTree: conditionGroupSchema.required(),
});
