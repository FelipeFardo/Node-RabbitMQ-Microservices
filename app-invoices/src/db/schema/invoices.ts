import { timestamp } from "drizzle-orm/pg-core";
import { text } from "drizzle-orm/pg-core";
import { pgTable } from "drizzle-orm/pg-core";
// import { customers } from "./customers.ts";

export const invoices = pgTable("invoices",{
  id: text().primaryKey(),
  orderId: text().notNull(),
  createdAt: timestamp().defaultNow().notNull()
})