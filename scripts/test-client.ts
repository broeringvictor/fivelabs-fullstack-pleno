import { prisma, disconnect } from "../src/infra/database/client.js";

const result = await prisma.$queryRaw`SELECT 1 AS ok`;
console.log(result);
await disconnect();
