import { ConditionGroup } from "./condition-group.js";
import { Condition } from "./condition.js";
import { type ConditionField } from "../enums/condition-field.js";
import { ConditionOperator } from "../enums/condition-operator.js";
import { LogicalOperator } from "../enums/logical-operator.js";

export interface SaleSnapshot {
  salespersonId: string;
  productId: string;
  regionId: string;
  amount: string;
}

export class ConditionTree {
  private readonly groupMap: Map<string, ConditionGroup>;
  private readonly conditionsByGroup: Map<string, Condition[]>;
  private readonly childGroupsByParent: Map<string, ConditionGroup[]>;
  readonly rootGroupId: string;

  constructor(groups: ConditionGroup[], conditions: Condition[]) {
    this.groupMap = new Map(groups.map((g) => [g.id, g]));
    this.conditionsByGroup = new Map();
    this.childGroupsByParent = new Map();

    for (const c of conditions) {
      const list = this.conditionsByGroup.get(c.groupId) ?? [];
      list.push(c);
      this.conditionsByGroup.set(c.groupId, list);
    }

    for (const g of groups) {
      if (g.parentGroupId !== null) {
        const siblings = this.childGroupsByParent.get(g.parentGroupId) ?? [];
        siblings.push(g);
        this.childGroupsByParent.set(g.parentGroupId, siblings);
      }
    }

    const root = groups.find((g) => g.isRoot);
    if (!root) throw new Error("ConditionTree has no root group");
    this.rootGroupId = root.id;
  }

  matches(sale: SaleSnapshot): boolean {
    return this.evaluateGroup(this.rootGroupId, sale);
  }

  private evaluateGroup(groupId: string, sale: SaleSnapshot): boolean {
    const group = this.groupMap.get(groupId);
    if (!group) return false;

    const conditions = this.conditionsByGroup.get(groupId) ?? [];
    const childGroups = this.childGroupsByParent.get(groupId) ?? [];

    const results: boolean[] = [
      ...conditions.map((c) => this.evaluateCondition(c, sale)),
      ...childGroups.map((cg) => this.evaluateGroup(cg.id, sale)),
    ];

    if (results.length === 0) return true;

    return group.logicalOperator === LogicalOperator.AND
      ? results.every(Boolean)
      : results.some(Boolean);
  }

  private evaluateCondition(condition: Condition, sale: SaleSnapshot): boolean {
    const fieldValue = this.resolveField(condition.field, sale);
    const condValue = condition.value.value;
    const op = condition.operator;

    if (op === ConditionOperator.IN) {
      return Array.isArray(condValue) && condValue.includes(fieldValue as never);
    }
    if (op === ConditionOperator.NOT_IN) {
      return Array.isArray(condValue) && !condValue.includes(fieldValue as never);
    }
    if (op === ConditionOperator.EQ) return fieldValue == condValue;
    if (op === ConditionOperator.NEQ) return fieldValue != condValue;

    const numField = Number(fieldValue);
    const numCond = Number(condValue);
    if (op === ConditionOperator.GT) return numField > numCond;
    if (op === ConditionOperator.GTE) return numField >= numCond;
    if (op === ConditionOperator.LT) return numField < numCond;
    if (op === ConditionOperator.LTE) return numField <= numCond;

    return false;
  }

  private resolveField(field: ConditionField, sale: SaleSnapshot): string | number {
    switch (field) {
      case "TOTAL_VALUE": return Number(sale.amount);
      case "REGION": return sale.regionId;
      case "PRODUCT": return sale.productId;
      case "SALESPERSON": return sale.salespersonId;
    }
  }
}

export function buildTree(groups: ConditionGroup[], conditions: Condition[]): ConditionTree {
  return new ConditionTree(groups, conditions);
}
