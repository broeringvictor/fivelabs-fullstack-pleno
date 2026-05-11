/**
 * Seed de demonstração — sistema de gestão de metas de vendas
 *
 * Cenário:
 *   Campanha "Demo — Remunera.ai" com 2 metas e condições aninhadas.
 *
 *   META 1 "Sudeste Premium" — R$ 5.000 fixo por vendedor que atingir
 *     Condições (2 níveis):
 *       AND (raiz)
 *         TOTAL_VALUE GT 50000          ← venda individual > R$ 50k
 *         AND (sub-grupo)
 *           REGION  IN [Sudeste, Sul]
 *           PRODUCT IN [Pro, Basic]
 *
 *     Ana Ribeiro    → ✅ ATINGIDA  (5 vendas qualificam)
 *     Carlos Mendes  → ✅ ATINGIDA  (3 vendas qualificam)
 *     Beatriz Santos → ❌ NÃO ATINGIDA (vendas no Norte ou < R$ 50k)
 *
 *   META 2 "Nacional Ouro" — 15 % sobre o realizado
 *     Condições:
 *       AND (raiz)
 *         TOTAL_VALUE GT 200000         ← venda individual > R$ 200k
 *         PRODUCT EQ Pro
 *
 *     Nenhum vendedor tem venda > R$ 200k → ninguém atinge.
 */

import { prisma } from "../src/infra/database/client.ts";
import * as bcrypt from "bcryptjs";
import Decimal from "decimal.js";
import { v7 as uuid7 } from "uuid";

const id   = () => uuid7();
const brl  = (v: number) => new Decimal(v).toFixed(2);

// ── Limpeza total (ordem respeita FK) ────────────────────────────────────────

async function limparBanco() {
  await prisma.appraisalResult.deleteMany();
  await prisma.appraisal.deleteMany();
  await prisma.condition.deleteMany();
  await prisma.conditionGroup.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.salesperson.deleteMany();
  await prisma.product.deleteMany();
  await prisma.region.deleteMany();
  await prisma.user.deleteMany();
  console.log("✓ Banco limpo");
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\nSeed de demonstração iniciando...\n");
  await limparBanco();

  // Usuários
  const adminId = id();
  await prisma.user.create({
    data: { id: adminId, name: "Admin Demo", email: "admin@demo.com", passwordHash: (bcrypt as any).hashSync("Admin@123", 10), role: "ADMIN" },
  });
  await prisma.user.create({
    data: { id: id(), name: "Admin Teste", email: "admin@teste.com", passwordHash: (bcrypt as any).hashSync("senha1234", 10), role: "ADMIN" },
  });
  console.log("✓ Usuários: admin@demo.com / Admin@123  |  admin@teste.com / senha1234");

  // Regiões
  const sudeste = await prisma.region.create({ data: { id: id(), name: "Sudeste" } });
  const sul     = await prisma.region.create({ data: { id: id(), name: "Sul"     } });
  const norte   = await prisma.region.create({ data: { id: id(), name: "Norte"   } });
  console.log("✓ Regiões: Sudeste, Sul, Norte");

  // Produtos
  const pro   = await prisma.product.create({ data: { id: id(), name: "Remunera.ai Pro",   sku: "REMU-PRO" } });
  const basic = await prisma.product.create({ data: { id: id(), name: "Remunera.ai Basic", sku: "REMU-BSC" } });
  console.log("✓ Produtos: Remunera.ai Pro, Remunera.ai Basic");

  // Vendedores
  const ana     = await prisma.salesperson.create({ data: { id: id(), name: "Ana Ribeiro",    document: "111.111.111-11" } });
  const carlos  = await prisma.salesperson.create({ data: { id: id(), name: "Carlos Mendes",  document: "222.222.222-22" } });
  const beatriz = await prisma.salesperson.create({ data: { id: id(), name: "Beatriz Santos", document: "333.333.333-33" } });
  console.log("✓ Vendedores: Ana Ribeiro, Carlos Mendes, Beatriz Santos");

  // Campanha
  const campanha = await prisma.campaign.create({
    data: {
      id: id(),
      name: "Demo — Remunera.ai",
      description: "Campanha de demonstração com condições aninhadas e dois cenários distintos.",
      createdById: adminId,
    },
  });
  console.log("✓ Campanha criada");

  // Vigência: últimos 30 dias → próximos 30 dias (ativa agora)
  const hoje  = new Date();
  const inicio = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000);
  const fim    = new Date(hoje.getTime() + 30 * 24 * 60 * 60 * 1000);

  // ── META 1: Sudeste Premium ───────────────────────────────────────────────
  //   AND (raiz)
  //     TOTAL_VALUE GT 50000
  //     AND (sub-grupo)
  //       REGION  IN [sudeste, sul]
  //       PRODUCT IN [pro, basic]

  const meta1Id = id();
  await prisma.goal.create({
    data: {
      id: meta1Id,
      campaignId: campanha.id,
      name: "Meta Sudeste Premium",
      validFrom: inicio,
      validTo: fim,
      compensationType: "FIXED",
      compensationValue: "5000.0000",
      compensationCurrency: "BRL",
    },
  });

  const m1Root = id();
  await prisma.conditionGroup.create({
    data: { id: m1Root, goalId: meta1Id, parentGroupId: null, logicalOperator: "AND" },
  });

  // Condição no raiz: venda > R$ 50k
  await prisma.condition.create({
    data: { id: id(), groupId: m1Root, field: "TOTAL_VALUE", operator: "GT", value: 50000 },
  });

  // Sub-grupo AND: localização e produto
  const m1Sub = id();
  await prisma.conditionGroup.create({
    data: { id: m1Sub, goalId: meta1Id, parentGroupId: m1Root, logicalOperator: "AND" },
  });

  await prisma.condition.create({
    data: { id: id(), groupId: m1Sub, field: "REGION",  operator: "IN", value: [sudeste.id, sul.id] },
  });
  await prisma.condition.create({
    data: { id: id(), groupId: m1Sub, field: "PRODUCT", operator: "IN", value: [pro.id, basic.id] },
  });

  console.log("✓ Meta 1: 'Sudeste Premium' (TOTAL_VALUE > 50k AND região AND produto)");

  // ── META 2: Nacional Ouro ─────────────────────────────────────────────────
  //   AND (raiz)
  //     TOTAL_VALUE GT 200000
  //     PRODUCT EQ pro

  const meta2Id = id();
  await prisma.goal.create({
    data: {
      id: meta2Id,
      campaignId: campanha.id,
      name: "Meta Nacional Ouro",
      validFrom: inicio,
      validTo: fim,
      compensationType: "PERCENTAGE",
      compensationValue: "15.0000",
      compensationCurrency: "BRL",
    },
  });

  const m2Root = id();
  await prisma.conditionGroup.create({
    data: { id: m2Root, goalId: meta2Id, parentGroupId: null, logicalOperator: "AND" },
  });

  await prisma.condition.create({
    data: { id: id(), groupId: m2Root, field: "TOTAL_VALUE", operator: "GT", value: 200000 },
  });
  await prisma.condition.create({
    data: { id: id(), groupId: m2Root, field: "PRODUCT", operator: "EQ", value: pro.id },
  });

  console.log("✓ Meta 2: 'Nacional Ouro' (TOTAL_VALUE > 200k AND PRODUCT = Pro) — ninguém atinge");

  // ── Vendas ────────────────────────────────────────────────────────────────

  const diasAtras = (n: number) => new Date(hoje.getTime() - n * 24 * 60 * 60 * 1000);

  const venda = (sp: string, prod: string, reg: string, valor: number, dias: number) => ({
    id: id(),
    salespersonId: sp,
    productId: prod,
    regionId: reg,
    amount: brl(valor),
    currency: "BRL",
    soldAt: diasAtras(dias),
  });

  const vendas = [
    // ── Ana Ribeiro ── 5 vendas qualificam Meta 1 (Sudeste/Sul + Pro/Basic + > 50k)
    venda(ana.id, pro.id,   sudeste.id, 80_000,  3),
    venda(ana.id, pro.id,   sudeste.id, 65_000,  7),
    venda(ana.id, pro.id,   sudeste.id, 92_000, 12),
    venda(ana.id, basic.id, sudeste.id, 58_000, 17),
    venda(ana.id, pro.id,   sul.id,     71_000, 21),
    // vendas que NÃO qualificam (Norte ou valor baixo)
    venda(ana.id, pro.id,   norte.id,   45_000, 25),   // região errada
    venda(ana.id, basic.id, norte.id,   30_000, 28),   // região errada + valor baixo

    // ── Carlos Mendes ── 3 vendas qualificam Meta 1 (Sudeste + Pro/Basic + > 50k)
    venda(carlos.id, pro.id,   sudeste.id, 62_000,  4),
    venda(carlos.id, pro.id,   sudeste.id, 55_000,  9),
    venda(carlos.id, basic.id, sudeste.id, 78_000, 14),
    // vendas que NÃO qualificam
    venda(carlos.id, pro.id,   sudeste.id, 42_000, 20),  // valor < 50k
    venda(carlos.id, pro.id,   norte.id,   88_000, 24),  // região errada

    // ── Beatriz Santos ── nenhuma venda qualifica Meta 1
    // Norte com bons valores → região errada para Meta 1
    venda(beatriz.id, pro.id,   norte.id, 75_000,  5),
    venda(beatriz.id, pro.id,   norte.id, 83_000, 10),
    venda(beatriz.id, pro.id,   norte.id, 67_000, 15),
    // Sudeste mas valor baixo → abaixo do threshold
    venda(beatriz.id, pro.id,   sudeste.id, 38_000, 18),
    venda(beatriz.id, basic.id, sudeste.id, 44_000, 22),
    venda(beatriz.id, pro.id,   sul.id,     35_000, 27),
  ];

  await prisma.sale.createMany({ data: vendas });
  console.log(`✓ ${vendas.length} vendas criadas\n`);

  // ── Resumo ────────────────────────────────────────────────────────────────
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║          RESUMO DO CENÁRIO DE DEMONSTRAÇÃO                  ║");
  console.log("╠══════════════════════════════════════════════════════════════╣");
  console.log("║  Login: admin@demo.com  /  Admin@123                        ║");
  console.log("╠══════════════════════════════════════════════════════════════╣");
  console.log("║  META 1 — Sudeste Premium   (R$ 5.000 fixo)                 ║");
  console.log("║    TOTAL_VALUE > 50k                                         ║");
  console.log("║    AND REGION  IN [Sudeste, Sul]   (sub-grupo aninhado)      ║");
  console.log("║    AND PRODUCT IN [Pro, Basic]     (sub-grupo aninhado)      ║");
  console.log("║                                                              ║");
  console.log("║    Ana Ribeiro    → ✅ ATINGIDA   (5 vendas qualificam)      ║");
  console.log("║    Carlos Mendes  → ✅ ATINGIDA   (3 vendas qualificam)      ║");
  console.log("║    Beatriz Santos → ❌ NÃO ATINGIDA                          ║");
  console.log("╠══════════════════════════════════════════════════════════════╣");
  console.log("║  META 2 — Nacional Ouro   (15 % do realizado)               ║");
  console.log("║    TOTAL_VALUE > 200k AND PRODUCT = Pro                     ║");
  console.log("║    Nenhuma venda ultrapassa R$ 200k → 0 atingimentos         ║");
  console.log("║                                                              ║");
  console.log("║    Ana Ribeiro    → ❌ NÃO ATINGIDA                          ║");
  console.log("║    Carlos Mendes  → ❌ NÃO ATINGIDA                          ║");
  console.log("║    Beatriz Santos → ❌ NÃO ATINGIDA                          ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
