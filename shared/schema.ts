import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, decimal, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  trustScore: integer("trust_score").default(75),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const cases = pgTable("cases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  userId: varchar("user_id").references(() => users.id).notNull(),
  status: text("status").default("active"), // active, closed, archived
  trustScore: integer("trust_score").default(0),
  totalEvidence: integer("total_evidence").default(0),
  verifiedEvidence: integer("verified_evidence").default(0),
  pendingEvidence: integer("pending_evidence").default(0),
  mintedEvidence: integer("minted_evidence").default(0),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

export const evidence = pgTable("evidence", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  caseId: varchar("case_id").references(() => cases.id).notNull(),
  artifactId: text("artifact_id").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull(), // document, image, communication, financial, legal, property_tax
  subtype: text("subtype"), // contract, email_thread, bank_statement, assessment, etc.
  filePath: text("file_path"),
  fileSize: integer("file_size"),
  mimeType: text("mime_type"),
  status: text("status").default("pending"), // pending, verified, failed, minted
  trustScore: integer("trust_score").default(0),
  blockchain: jsonb("blockchain"), // chain status, hash, block number
  facts: jsonb("facts"), // extracted facts and key information
  analysis: jsonb("analysis"), // AI analysis results
  metadata: jsonb("metadata"), // additional metadata
  uploadedAt: timestamp("uploaded_at").default(sql`now()`),
  verifiedAt: timestamp("verified_at"),
  mintedAt: timestamp("minted_at"),
});

export const propertyTaxRecords = pgTable("property_tax_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  evidenceId: varchar("evidence_id").references(() => evidence.id).notNull(),
  pin: text("pin").notNull(), // Property Index Number
  address: text("address").notNull(),
  year: integer("year").notNull(),
  landAssessment: decimal("land_assessment", { precision: 12, scale: 2 }),
  buildingAssessment: decimal("building_assessment", { precision: 12, scale: 2 }),
  totalAssessment: decimal("total_assessment", { precision: 12, scale: 2 }),
  estimatedTax: decimal("estimated_tax", { precision: 12, scale: 2 }),
  propertyClass: text("property_class"),
  squareFeet: integer("square_feet"),
  yearBuilt: integer("year_built"),
  assessorData: jsonb("assessor_data"), // raw assessor data
  treasurerData: jsonb("treasurer_data"), // raw treasurer data
  scrapedAt: timestamp("scraped_at").default(sql`now()`),
});

export const paymentHistory = pgTable("payment_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyTaxRecordId: varchar("property_tax_record_id").references(() => propertyTaxRecords.id).notNull(),
  paymentDate: timestamp("payment_date").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  method: text("method"), // check, online, cash, etc.
  confirmationNumber: text("confirmation_number"),
  installmentNumber: integer("installment_number"),
  status: text("status").default("completed"), // completed, pending, failed
});

export const analysisResults = pgTable("analysis_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  evidenceId: varchar("evidence_id").references(() => evidence.id).notNull(),
  type: text("type").notNull(), // ai_analysis, swarm_intelligence, trust_calculation
  confidence: decimal("confidence", { precision: 5, scale: 4 }), // 0.0000 to 1.0000
  results: jsonb("results").notNull(),
  recommendations: jsonb("recommendations"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const blockchainTransactions = pgTable("blockchain_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  evidenceId: varchar("evidence_id").references(() => evidence.id).notNull(),
  transactionHash: text("transaction_hash").notNull().unique(),
  blockNumber: integer("block_number"),
  blockHash: text("block_hash"),
  gasUsed: integer("gas_used"),
  gasPrice: decimal("gas_price", { precision: 20, scale: 0 }),
  status: text("status").default("pending"), // pending, confirmed, failed
  networkStatus: text("network_status").default("active"),
  createdAt: timestamp("created_at").default(sql`now()`),
  confirmedAt: timestamp("confirmed_at"),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  trustScore: true,
  createdAt: true,
});

export const insertCaseSchema = createInsertSchema(cases).omit({
  id: true,
  trustScore: true,
  totalEvidence: true,
  verifiedEvidence: true,
  pendingEvidence: true,
  mintedEvidence: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEvidenceSchema = createInsertSchema(evidence).omit({
  id: true,
  trustScore: true,
  uploadedAt: true,
  verifiedAt: true,
  mintedAt: true,
});

export const insertPropertyTaxRecordSchema = createInsertSchema(propertyTaxRecords).omit({
  id: true,
  scrapedAt: true,
});

export const insertPaymentHistorySchema = createInsertSchema(paymentHistory).omit({
  id: true,
});

export const insertAnalysisResultSchema = createInsertSchema(analysisResults).omit({
  id: true,
  createdAt: true,
});

export const insertBlockchainTransactionSchema = createInsertSchema(blockchainTransactions).omit({
  id: true,
  createdAt: true,
  confirmedAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertCase = z.infer<typeof insertCaseSchema>;
export type Case = typeof cases.$inferSelect;

export type InsertEvidence = z.infer<typeof insertEvidenceSchema>;
export type Evidence = typeof evidence.$inferSelect;

export type InsertPropertyTaxRecord = z.infer<typeof insertPropertyTaxRecordSchema>;
export type PropertyTaxRecord = typeof propertyTaxRecords.$inferSelect;

export type InsertPaymentHistory = z.infer<typeof insertPaymentHistorySchema>;
export type PaymentHistory = typeof paymentHistory.$inferSelect;

export type InsertAnalysisResult = z.infer<typeof insertAnalysisResultSchema>;
export type AnalysisResult = typeof analysisResults.$inferSelect;

export type InsertBlockchainTransaction = z.infer<typeof insertBlockchainTransactionSchema>;
export type BlockchainTransaction = typeof blockchainTransactions.$inferSelect;
