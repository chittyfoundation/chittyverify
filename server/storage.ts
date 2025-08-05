import { type User, type InsertUser, type Case, type InsertCase, type Evidence, type InsertEvidence, type PropertyTaxRecord, type InsertPropertyTaxRecord, type PaymentHistory, type InsertPaymentHistory, type AnalysisResult, type InsertAnalysisResult, type BlockchainTransaction, type InsertBlockchainTransaction } from "../shared/schema";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { users, cases, evidence, propertyTaxRecords, paymentHistory, analysisResults, blockchainTransactions } from "../shared/schema";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserTrustScore(id: string, trustScore: number): Promise<User | undefined>;

  // Cases
  getCase(id: string): Promise<Case | undefined>;
  getCasesByUserId(userId: string): Promise<Case[]>;
  createCase(caseData: InsertCase): Promise<Case>;
  updateCase(id: string, updates: Partial<Case>): Promise<Case | undefined>;
  updateCaseStats(caseId: string): Promise<void>;

  // Evidence
  getEvidence(id: string): Promise<Evidence | undefined>;
  getEvidenceByCaseId(caseId: string): Promise<Evidence[]>;
  createEvidence(evidence: InsertEvidence): Promise<Evidence>;
  updateEvidence(id: string, updates: Partial<Evidence>): Promise<Evidence | undefined>;
  updateEvidenceStatus(id: string, status: string, trustScore?: number): Promise<Evidence | undefined>;

  // Property Tax Records
  getPropertyTaxRecord(id: string): Promise<PropertyTaxRecord | undefined>;
  getPropertyTaxRecordByEvidenceId(evidenceId: string): Promise<PropertyTaxRecord | undefined>;
  createPropertyTaxRecord(record: InsertPropertyTaxRecord): Promise<PropertyTaxRecord>;
  getPropertyTaxRecordsByPin(pin: string): Promise<PropertyTaxRecord[]>;

  // Payment History
  getPaymentHistoryByPropertyTaxRecordId(propertyTaxRecordId: string): Promise<PaymentHistory[]>;
  createPaymentHistory(payment: InsertPaymentHistory): Promise<PaymentHistory>;

  // Analysis Results
  getAnalysisResultsByEvidenceId(evidenceId: string): Promise<AnalysisResult[]>;
  createAnalysisResult(analysis: InsertAnalysisResult): Promise<AnalysisResult>;

  // Blockchain Transactions
  getBlockchainTransactionByEvidenceId(evidenceId: string): Promise<BlockchainTransaction | undefined>;
  createBlockchainTransaction(transaction: InsertBlockchainTransaction): Promise<BlockchainTransaction>;
  updateBlockchainTransaction(id: string, updates: Partial<BlockchainTransaction>): Promise<BlockchainTransaction | undefined>;
}

export class DatabaseStorage implements IStorage {
  public db;

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is required");
    }
    
    const sql = neon(process.env.DATABASE_URL);
    this.db = drizzle(sql);
    
    // Initialize with demo data
    this.initializeDemoData();
  }

  private async initializeDemoData() {
    // Demo data initialization disabled - using authentic data only
    console.log('Database initialized - ready for authentic data');
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await this.db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUserTrustScore(id: string, trustScore: number): Promise<User | undefined> {
    const [updated] = await this.db.update(users)
      .set({ trustScore })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  // Cases
  async getCase(id: string): Promise<Case | undefined> {
    const result = await this.db.select().from(cases).where(eq(cases.id, id)).limit(1);
    return result[0];
  }

  async getCasesByUserId(userId: string): Promise<Case[]> {
    try {
      return await this.db.select().from(cases).where(eq(cases.userId, userId)).orderBy(desc(cases.createdAt));
    } catch (error) {
      console.error('Database error in getCasesByUserId:', error);
      throw error;
    }
  }

  async createCase(caseData: InsertCase): Promise<Case> {
    const [newCase] = await this.db.insert(cases).values(caseData).returning();
    return newCase;
  }

  async updateCase(id: string, updates: Partial<Case>): Promise<Case | undefined> {
    const [updated] = await this.db.update(cases)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(cases.id, id))
      .returning();
    return updated;
  }

  async updateCaseStats(caseId: string): Promise<void> {
    // Get evidence counts for this case
    const evidenceList = await this.db.select().from(evidence).where(eq(evidence.caseId, caseId));
    
    const totalEvidence = evidenceList.length;
    const verifiedEvidence = evidenceList.filter(e => e.status === 'verified').length;
    const pendingEvidence = evidenceList.filter(e => e.status === 'pending').length;
    const mintedEvidence = evidenceList.filter(e => e.status === 'minted').length;
    
    // Calculate average trust score
    const avgTrustScore = evidenceList.length > 0 
      ? Math.round(evidenceList.reduce((sum, e) => sum + (e.trustScore || 0), 0) / evidenceList.length)
      : 0;

    await this.db.update(cases)
      .set({
        totalEvidence,
        verifiedEvidence,
        pendingEvidence,
        mintedEvidence,
        trustScore: avgTrustScore,
        updatedAt: new Date()
      })
      .where(eq(cases.id, caseId));
  }

  // Evidence
  async getEvidence(id: string): Promise<Evidence | undefined> {
    const result = await this.db.select().from(evidence).where(eq(evidence.id, id)).limit(1);
    return result[0];
  }

  async getEvidenceByCaseId(caseId: string): Promise<Evidence[]> {
    return await this.db.select().from(evidence).where(eq(evidence.caseId, caseId)).orderBy(desc(evidence.uploadedAt));
  }

  async createEvidence(evidenceData: InsertEvidence): Promise<Evidence> {
    const [newEvidence] = await this.db.insert(evidence).values(evidenceData).returning();
    
    // Update case stats
    await this.updateCaseStats(newEvidence.caseId);
    
    return newEvidence;
  }

  async updateEvidence(id: string, updates: Partial<Evidence>): Promise<Evidence | undefined> {
    const [updated] = await this.db.update(evidence)
      .set(updates)
      .where(eq(evidence.id, id))
      .returning();
    
    if (updated) {
      await this.updateCaseStats(updated.caseId);
    }
    
    return updated;
  }

  async updateEvidenceStatus(id: string, status: string, trustScore?: number): Promise<Evidence | undefined> {
    const updates: Partial<Evidence> = { status };
    if (trustScore !== undefined) updates.trustScore = trustScore;
    if (status === 'verified') updates.verifiedAt = new Date();
    if (status === 'minted') updates.mintedAt = new Date();
    
    return await this.updateEvidence(id, updates);
  }

  // Property Tax Records
  async getPropertyTaxRecord(id: string): Promise<PropertyTaxRecord | undefined> {
    const result = await this.db.select().from(propertyTaxRecords).where(eq(propertyTaxRecords.id, id)).limit(1);
    return result[0];
  }

  async getPropertyTaxRecordByEvidenceId(evidenceId: string): Promise<PropertyTaxRecord | undefined> {
    const result = await this.db.select().from(propertyTaxRecords).where(eq(propertyTaxRecords.evidenceId, evidenceId)).limit(1);
    return result[0];
  }

  async createPropertyTaxRecord(record: InsertPropertyTaxRecord): Promise<PropertyTaxRecord> {
    const [newRecord] = await this.db.insert(propertyTaxRecords).values(record).returning();
    return newRecord;
  }

  async getPropertyTaxRecordsByPin(pin: string): Promise<PropertyTaxRecord[]> {
    return await this.db.select().from(propertyTaxRecords).where(eq(propertyTaxRecords.pin, pin)).orderBy(desc(propertyTaxRecords.year));
  }

  // Payment History
  async getPaymentHistoryByPropertyTaxRecordId(propertyTaxRecordId: string): Promise<PaymentHistory[]> {
    return await this.db.select().from(paymentHistory).where(eq(paymentHistory.propertyTaxRecordId, propertyTaxRecordId)).orderBy(desc(paymentHistory.paymentDate));
  }

  async createPaymentHistory(payment: InsertPaymentHistory): Promise<PaymentHistory> {
    const [newPayment] = await this.db.insert(paymentHistory).values(payment).returning();
    return newPayment;
  }

  // Analysis Results
  async getAnalysisResultsByEvidenceId(evidenceId: string): Promise<AnalysisResult[]> {
    return await this.db.select().from(analysisResults).where(eq(analysisResults.evidenceId, evidenceId)).orderBy(desc(analysisResults.createdAt));
  }

  async createAnalysisResult(analysis: InsertAnalysisResult): Promise<AnalysisResult> {
    const [newAnalysis] = await this.db.insert(analysisResults).values(analysis).returning();
    return newAnalysis;
  }

  // Blockchain Transactions
  async getBlockchainTransactionByEvidenceId(evidenceId: string): Promise<BlockchainTransaction | undefined> {
    const result = await this.db.select().from(blockchainTransactions).where(eq(blockchainTransactions.evidenceId, evidenceId)).limit(1);
    return result[0];
  }

  async createBlockchainTransaction(transaction: InsertBlockchainTransaction): Promise<BlockchainTransaction> {
    const [newTransaction] = await this.db.insert(blockchainTransactions).values(transaction).returning();
    return newTransaction;
  }

  async updateBlockchainTransaction(id: string, updates: Partial<BlockchainTransaction>): Promise<BlockchainTransaction | undefined> {
    const [updated] = await this.db.update(blockchainTransactions)
      .set(updates)
      .where(eq(blockchainTransactions.id, id))
      .returning();
    return updated;
  }
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private cases: Map<string, Case> = new Map();
  private evidence: Map<string, Evidence> = new Map();
  private propertyTaxRecords: Map<string, PropertyTaxRecord> = new Map();
  private paymentHistory: Map<string, PaymentHistory> = new Map();
  private analysisResults: Map<string, AnalysisResult> = new Map();
  private blockchainTransactions: Map<string, BlockchainTransaction> = new Map();

  constructor() {
    this.seedData();
  }

  private seedData() {
    // Create demo user
    const demoUser: User = {
      id: "demo-user-1",
      username: "john.doe",
      password: "hashedpassword",
      email: "john.doe@example.com",
      trustScore: 85,
      createdAt: new Date("2024-01-01"),
    };
    this.users.set(demoUser.id, demoUser);

    // Create demo case
    const demoCase: Case = {
      id: "case-1",
      name: "Johnson vs. Smith Property Dispute",
      description: "Property tax assessment dispute for 541 W Addison St",
      userId: demoUser.id,
      status: "active",
      trustScore: 89,
      totalEvidence: 5,
      verifiedEvidence: 3,
      pendingEvidence: 1,
      mintedEvidence: 2,
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-26"),
    };
    this.cases.set(demoCase.id, demoCase);

    // Create demo evidence
    const evidenceItems: Evidence[] = [
      {
        id: "evidence-1",
        caseId: demoCase.id,
        artifactId: "DOC-2024-001",
        title: "Property Tax Assessment 2024",
        description: "Cook County property tax assessment for 541 W Addison St",
        type: "property_tax",
        subtype: "assessment",
        filePath: "/uploads/assessment-2024.pdf",
        fileSize: 245760,
        mimeType: "application/pdf",
        status: "verified",
        trustScore: 92,
        blockchain: {
          status: "minted",
          hash: "0x1234567890abcdef",
          blockNumber: 2847392,
        },
        facts: {
          pin: "14-21-111-008-1006",
          address: "541 W ADDISON ST",
          totalAssessment: 285000,
          landAssessment: 85000,
          buildingAssessment: 200000,
          estimatedTax: 8925,
          year: 2024,
        },
        analysis: {
          confidence: 0.92,
          keyFindings: [
            "Assessment increased 12% from previous year",
            "Property class correctly classified as Class 2",
            "Assessment within market range for neighborhood",
          ],
        },
        metadata: {
          source: "cook_county_assessor",
          scraped: true,
          verified: true,
        },
        uploadedAt: new Date("2024-01-15"),
        verifiedAt: new Date("2024-01-16"),
        mintedAt: new Date("2024-01-17"),
      },
      {
        id: "evidence-2",
        caseId: demoCase.id,
        artifactId: "EML-2024-012",
        title: "Email Thread - Assessment Appeal",
        description: "Email correspondence regarding property tax assessment appeal",
        type: "communication",
        subtype: "email_thread",
        filePath: "/uploads/email-thread.eml",
        fileSize: 15680,
        mimeType: "message/rfc822",
        status: "verified",
        trustScore: 78,
        blockchain: null,
        facts: {
          participants: ["john.doe@example.com", "assessor@cookcountyil.gov"],
          dateRange: "Dec 15, 2023 - Jan 10, 2024",
          messageCount: 23,
          keywords: ["settlement", "appeal", "assessment", "deadline"],
        },
        analysis: {
          confidence: 0.78,
          keyFindings: [
            "Settlement offer mentioned 3 times",
            "Deadline extensions requested",
            "Payment delays acknowledged",
          ],
        },
        metadata: {
          headers_verified: true,
          dkim_valid: true,
          authenticity_score: 0.95,
        },
        uploadedAt: new Date("2024-01-18"),
        verifiedAt: new Date("2024-01-19"),
        mintedAt: null,
      },
      {
        id: "evidence-3",
        caseId: demoCase.id,
        artifactId: "FIN-2024-007",
        title: "Property Tax Payment Records",
        description: "Bank statements and payment confirmations for property taxes",
        type: "financial",
        subtype: "payment_records",
        filePath: "/uploads/payment-records.pdf",
        fileSize: 89234,
        mimeType: "application/pdf",
        status: "verified",
        trustScore: 95,
        blockchain: {
          status: "minted",
          hash: "0xabcdef1234567890",
          blockNumber: 2847385,
        },
        facts: {
          totalTransactions: 127450,
          outstandingBalance: 12300,
          latePaymentFees: 450,
          period: "Q4 2023",
          paymentMethod: "bank_transfer",
        },
        analysis: {
          confidence: 0.95,
          keyFindings: [
            "All payments properly documented",
            "Late fees applied correctly",
            "Outstanding balance matches treasurer records",
          ],
        },
        metadata: {
          bank_verified: true,
          source: "chase_bank",
          statement_period: "2023-10-01 to 2023-12-31",
        },
        uploadedAt: new Date("2024-01-20"),
        verifiedAt: new Date("2024-01-21"),
        mintedAt: new Date("2024-01-22"),
      },
    ];

    evidenceItems.forEach(evidence => {
      this.evidence.set(evidence.id, evidence);
    });
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      trustScore: 75,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserTrustScore(id: string, trustScore: number): Promise<User | undefined> {
    const user = this.users.get(id);
    if (user) {
      const updatedUser = { ...user, trustScore };
      this.users.set(id, updatedUser);
      return updatedUser;
    }
    return undefined;
  }

  // Cases
  async getCase(id: string): Promise<Case | undefined> {
    return this.cases.get(id);
  }

  async getCasesByUserId(userId: string): Promise<Case[]> {
    return Array.from(this.cases.values()).filter(case_ => case_.userId === userId);
  }

  async createCase(insertCase: InsertCase): Promise<Case> {
    const id = randomUUID();
    const case_: Case = {
      ...insertCase,
      id,
      trustScore: 0,
      totalEvidence: 0,
      verifiedEvidence: 0,
      pendingEvidence: 0,
      mintedEvidence: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.cases.set(id, case_);
    return case_;
  }

  async updateCase(id: string, updates: Partial<Case>): Promise<Case | undefined> {
    const case_ = this.cases.get(id);
    if (case_) {
      const updatedCase = { ...case_, ...updates, updatedAt: new Date() };
      this.cases.set(id, updatedCase);
      return updatedCase;
    }
    return undefined;
  }

  async updateCaseStats(caseId: string): Promise<void> {
    const caseEvidence = Array.from(this.evidence.values()).filter(e => e.caseId === caseId);
    const totalEvidence = caseEvidence.length;
    const verifiedEvidence = caseEvidence.filter(e => e.status === "verified").length;
    const pendingEvidence = caseEvidence.filter(e => e.status === "pending").length;
    const mintedEvidence = caseEvidence.filter(e => e.blockchain && e.blockchain.status === "minted").length;
    
    const avgTrustScore = totalEvidence > 0 
      ? Math.round(caseEvidence.reduce((sum, e) => sum + (e.trustScore || 0), 0) / totalEvidence)
      : 0;

    await this.updateCase(caseId, {
      totalEvidence,
      verifiedEvidence,
      pendingEvidence,
      mintedEvidence,
      trustScore: avgTrustScore,
    });
  }

  // Evidence
  async getEvidence(id: string): Promise<Evidence | undefined> {
    return this.evidence.get(id);
  }

  async getEvidenceByCaseId(caseId: string): Promise<Evidence[]> {
    return Array.from(this.evidence.values()).filter(evidence => evidence.caseId === caseId);
  }

  async createEvidence(insertEvidence: InsertEvidence): Promise<Evidence> {
    const id = randomUUID();
    const evidence: Evidence = {
      ...insertEvidence,
      id,
      trustScore: 0,
      uploadedAt: new Date(),
      verifiedAt: null,
      mintedAt: null,
    };
    this.evidence.set(id, evidence);
    await this.updateCaseStats(evidence.caseId);
    return evidence;
  }

  async updateEvidence(id: string, updates: Partial<Evidence>): Promise<Evidence | undefined> {
    const evidence = this.evidence.get(id);
    if (evidence) {
      const updatedEvidence = { ...evidence, ...updates };
      this.evidence.set(id, updatedEvidence);
      await this.updateCaseStats(evidence.caseId);
      return updatedEvidence;
    }
    return undefined;
  }

  async updateEvidenceStatus(id: string, status: string, trustScore?: number): Promise<Evidence | undefined> {
    const evidence = this.evidence.get(id);
    if (evidence) {
      const updates: Partial<Evidence> = { status };
      if (trustScore !== undefined) {
        updates.trustScore = trustScore;
      }
      if (status === "verified") {
        updates.verifiedAt = new Date();
      }
      if (status === "minted") {
        updates.mintedAt = new Date();
      }
      return this.updateEvidence(id, updates);
    }
    return undefined;
  }

  // Property Tax Records
  async getPropertyTaxRecord(id: string): Promise<PropertyTaxRecord | undefined> {
    return this.propertyTaxRecords.get(id);
  }

  async getPropertyTaxRecordByEvidenceId(evidenceId: string): Promise<PropertyTaxRecord | undefined> {
    return Array.from(this.propertyTaxRecords.values()).find(record => record.evidenceId === evidenceId);
  }

  async createPropertyTaxRecord(insertRecord: InsertPropertyTaxRecord): Promise<PropertyTaxRecord> {
    const id = randomUUID();
    const record: PropertyTaxRecord = {
      ...insertRecord,
      id,
      scrapedAt: new Date(),
    };
    this.propertyTaxRecords.set(id, record);
    return record;
  }

  async getPropertyTaxRecordsByPin(pin: string): Promise<PropertyTaxRecord[]> {
    return Array.from(this.propertyTaxRecords.values()).filter(record => record.pin === pin);
  }

  // Payment History
  async getPaymentHistoryByPropertyTaxRecordId(propertyTaxRecordId: string): Promise<PaymentHistory[]> {
    return Array.from(this.paymentHistory.values()).filter(payment => payment.propertyTaxRecordId === propertyTaxRecordId);
  }

  async createPaymentHistory(insertPayment: InsertPaymentHistory): Promise<PaymentHistory> {
    const id = randomUUID();
    const payment: PaymentHistory = { ...insertPayment, id };
    this.paymentHistory.set(id, payment);
    return payment;
  }

  // Analysis Results
  async getAnalysisResultsByEvidenceId(evidenceId: string): Promise<AnalysisResult[]> {
    return Array.from(this.analysisResults.values()).filter(result => result.evidenceId === evidenceId);
  }

  async createAnalysisResult(insertAnalysis: InsertAnalysisResult): Promise<AnalysisResult> {
    const id = randomUUID();
    const analysis: AnalysisResult = {
      ...insertAnalysis,
      id,
      createdAt: new Date(),
    };
    this.analysisResults.set(id, analysis);
    return analysis;
  }

  // Blockchain Transactions
  async getBlockchainTransactionByEvidenceId(evidenceId: string): Promise<BlockchainTransaction | undefined> {
    return Array.from(this.blockchainTransactions.values()).find(tx => tx.evidenceId === evidenceId);
  }

  async createBlockchainTransaction(insertTransaction: InsertBlockchainTransaction): Promise<BlockchainTransaction> {
    const id = randomUUID();
    const transaction: BlockchainTransaction = {
      ...insertTransaction,
      id,
      createdAt: new Date(),
      confirmedAt: null,
    };
    this.blockchainTransactions.set(id, transaction);
    return transaction;
  }

  async updateBlockchainTransaction(id: string, updates: Partial<BlockchainTransaction>): Promise<BlockchainTransaction | undefined> {
    const transaction = this.blockchainTransactions.get(id);
    if (transaction) {
      const updatedTransaction = { ...transaction, ...updates };
      if (updates.status === "confirmed") {
        updatedTransaction.confirmedAt = new Date();
      }
      this.blockchainTransactions.set(id, updatedTransaction);
      return updatedTransaction;
    }
    return undefined;
  }
}

// Use database storage for production
export const storage = new DatabaseStorage();
