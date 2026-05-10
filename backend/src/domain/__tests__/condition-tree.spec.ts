import { describe, it, expect } from "vitest";
import { buildTree, type SaleSnapshot } from "../entities/condition-tree.js";
import { ConditionGroup } from "../entities/condition-group.js";
import { Condition } from "../entities/condition.js";
import { ConditionValue } from "../value-objects/condition-value.js";

function makeGroup(id: string, goalId: string, operator: "AND" | "OR", parentGroupId: string | null = null): ConditionGroup {
  return ConditionGroup.reconstruct({
    id,
    goalId,
    parentGroupId,
    logicalOperator: operator,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  });
}

function makeCondition(id: string, groupId: string, field: "TOTAL_VALUE" | "REGION", operator: "GT" | "IN", rawValue: unknown): Condition {
  const value = ConditionValue.reconstruct(rawValue as never);
  return Condition.reconstruct({
    id,
    groupId,
    field,
    operator,
    value,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  });
}

describe("ConditionTree", () => {
  const goalId = "goal-1";
  const rootGroup = makeGroup("g1", goalId, "AND");
  const condValue = makeCondition("c1", "g1", "TOTAL_VALUE", "GT", 1000);
  const condRegion = makeCondition("c2", "g1", "REGION", "IN", ["SP", "RJ"]);
  const tree = buildTree([rootGroup], [condValue, condRegion]);

  const matchingSale: SaleSnapshot = {
    salespersonId: "sp1",
    productId: "p1",
    regionId: "SP",
    amount: "1500",
  };

  const lowValueSale: SaleSnapshot = { ...matchingSale, amount: "500" };
  const wrongRegionSale: SaleSnapshot = { ...matchingSale, regionId: "MG" };

  it("matches sale satisfying all conditions (AND)", () => {
    expect(tree.matches(matchingSale)).toBe(true);
  });

  it("does not match sale with low value", () => {
    expect(tree.matches(lowValueSale)).toBe(false);
  });

  it("does not match sale with wrong region", () => {
    expect(tree.matches(wrongRegionSale)).toBe(false);
  });
});
