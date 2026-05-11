// frontend/src/types/goal.ts

export type ConditionField = 'TOTAL_VALUE' | 'REGION' | 'PRODUCT' | 'SALESPERSON';

export type ConditionOperator =
  | 'EQ' | 'NEQ'
  | 'GT' | 'GTE' | 'LT' | 'LTE'
  | 'IN' | 'NOT_IN';

export type LogicalOperator = 'AND' | 'OR';

export type ConditionInput = {
  field: ConditionField;
  operator: ConditionOperator;
  value: string | number | string[];
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
  compensationType: 'FIXED' | 'PERCENTAGE';
  compensationValue: number;
  compensationCurrency?: string;
  conditionTree: ConditionGroupInput;
};

export type Goal = {
  id: string;
  campaignId: string;
  name: string;
  validFrom: string;
  validTo: string;
  compensationType: 'FIXED' | 'PERCENTAGE';
  compensationValue: string;
  compensationCurrency: string | null;
};

// Tipos de rascunho para o estado local do form
// _id é gerado com crypto.randomUUID() e serve apenas como React key
export type ConditionDraft = {
  _id: string;
  field: ConditionField;
  operator: ConditionOperator;
  rawValue: string; // sempre string nos inputs; convertido para o tipo correto no submit
};

export type ConditionGroupDraft = {
  _id: string;
  logicalOperator: LogicalOperator;
  conditions: ConditionDraft[];
  children: ConditionGroupDraft[];
};
