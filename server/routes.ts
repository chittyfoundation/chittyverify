import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCaseSchema, insertMasterEvidenceSchema, insertAtomicFactSchema } from "../shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Cases routes
  app.get("/api/cases", async (req, res) => {
    try {
      const allCases = await storage.getCasesByUserId("all");
      res.json(allCases);
    } catch (error) {
      console.error('Cases API error:', error);
      res.status(500).json({ message: "Failed to fetch cases" });
    }
  });

  app.get("/api/cases/:id", async (req, res) => {
    try {
      const case_ = await storage.getCase(req.params.id);
      if (!case_) {
        return res.status(404).json({ message: "Case not found" });
      }
      res.json(case_);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch case" });
    }
  });

  app.post("/api/cases", async (req, res) => {
    try {
      const validatedData = insertCaseSchema.parse(req.body);
      const case_ = await storage.createCase(validatedData);
      res.status(201).json(case_);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid case data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create case" });
    }
  });

  // Master Evidence routes
  app.get("/api/cases/:caseId/evidence", async (req, res) => {
    try {
      const evidence = await storage.getMasterEvidenceByCase(req.params.caseId);
      res.json(evidence);
    } catch (error) {
      console.error('Evidence API error:', error);
      res.status(500).json({ message: "Failed to fetch evidence" });
    }
  });

  app.post("/api/cases/:caseId/evidence", async (req, res) => {
    try {
      const validatedData = insertMasterEvidenceSchema.parse({
        ...req.body,
        caseBinding: req.params.caseId,
      });
      const evidence = await storage.createMasterEvidence(validatedData);
      res.status(201).json(evidence);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid evidence data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create evidence" });
    }
  });

  // Atomic Facts routes
  app.get("/api/evidence/:evidenceId/facts", async (req, res) => {
    try {
      const facts = await storage.getAtomicFactsByEvidence(req.params.evidenceId);
      res.json(facts);
    } catch (error) {
      console.error('Facts API error:', error);
      res.status(500).json({ message: "Failed to fetch facts" });
    }
  });

  app.post("/api/evidence/:evidenceId/facts", async (req, res) => {
    try {
      const validatedData = insertAtomicFactSchema.parse({
        ...req.body,
        parentDocument: req.params.evidenceId,
      });
      const fact = await storage.createAtomicFact(validatedData);
      res.status(201).json(fact);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid fact data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create fact" });
    }
  });

  // Audit Trail route
  app.get("/api/audit", async (req, res) => {
    try {
      const auditTrail = await storage.getAuditTrail();
      res.json(auditTrail);
    } catch (error) {
      console.error('Audit API error:', error);
      res.status(500).json({ message: "Failed to fetch audit trail" });
    }
  });

  // Contradictions route
  app.get("/api/contradictions", async (req, res) => {
    try {
      const contradictions = await storage.getContradictions();
      res.json(contradictions);
    } catch (error) {
      console.error('Contradictions API error:', error);
      res.status(500).json({ message: "Failed to fetch contradictions" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}