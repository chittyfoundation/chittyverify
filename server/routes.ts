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
      
      // Check if evidence already verified with this hash
      if (validatedData.contentHash) {
        const alreadyVerified = await storage.checkEvidenceAlreadyVerified(validatedData.contentHash);
        if (alreadyVerified) {
          return res.status(409).json({ 
            message: "Evidence already verified", 
            existingArtifact: alreadyVerified.artifactId,
            verificationDate: alreadyVerified.updatedAt
          });
        }
      }
      
      const evidence = await storage.createMasterEvidence(validatedData);
      res.status(201).json(evidence);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid evidence data", errors: error.errors });
      }
      if (error.message.includes("already exists")) {
        return res.status(409).json({ message: error.message });
      }
      console.error('Evidence creation error:', error);
      res.status(500).json({ message: "Failed to create evidence" });
    }
  });

  // Evidence verification endpoints
  app.put("/api/evidence/:id/verify", async (req, res) => {
    try {
      const { status } = req.body; // 'Verified' | 'Failed' | 'Pending'
      const updated = await storage.updateVerificationStatus(req.params.id, status);
      if (!updated) {
        return res.status(404).json({ message: "Evidence not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error('Verification error:', error);
      res.status(500).json({ message: "Failed to update verification status" });
    }
  });

  app.get("/api/evidence/:id/integrity", async (req, res) => {
    try {
      const { contentHash } = req.query;
      if (!contentHash) {
        return res.status(400).json({ message: "Content hash required" });
      }
      const isValid = await storage.verifyEvidenceIntegrity(req.params.id, contentHash as string);
      res.json({ isValid, evidenceId: req.params.id });
    } catch (error) {
      console.error('Integrity check error:', error);
      res.status(500).json({ message: "Failed to verify integrity" });
    }
  });

  // ChittyVerify - Immutable verification before blockchain
  app.post("/api/evidence/:id/chitty-verify", async (req, res) => {
    try {
      const evidence = await storage.getMasterEvidence(req.params.id);
      if (!evidence) {
        return res.status(404).json({ message: "Evidence not found" });
      }

      // Get user trust score for verification logic
      const user = await storage.getUser(evidence.userBinding);
      const userTrustScore = user?.composite6DTrust || 3.0;

      const { chittyVerify } = await import('./chitty-verify');
      const verifyResult = await chittyVerify.verifyEvidence({
        id: evidence.id,
        contentHash: evidence.contentHash || '',
        evidenceType: evidence.evidenceType,
        evidenceTier: evidence.evidenceTier,
        sourceVerificationStatus: evidence.sourceVerificationStatus || 'Pending',
        userTrustScore: Number(userTrustScore)
      });

      // Update evidence with ChittyVerify result
      const updated = await storage.chittyVerifyEvidence(req.params.id, verifyResult);
      
      res.json({
        evidence: updated,
        verifyResult,
        message: `ChittyVerify ${verifyResult.status}: Evidence is now immutably verified off-chain`
      });
    } catch (error) {
      console.error('ChittyVerify error:', error);
      res.status(500).json({ message: "Failed to ChittyVerify evidence" });
    }
  });

  app.get("/api/evidence/:id/chitty-verify-status", async (req, res) => {
    try {
      const evidence = await storage.getMasterEvidence(req.params.id);
      if (!evidence) {
        return res.status(404).json({ message: "Evidence not found" });
      }

      const { chittyVerify } = await import('./chitty-verify');
      const readyForMinting = chittyVerify.isReadyForMinting({
        verifyStatus: evidence.verifyStatus || 'Unverified',
        verifySignature: evidence.verifySignature || '',
        mintingStatus: evidence.mintingStatus || 'Pending'
      });

      res.json({
        verifyStatus: evidence.verifyStatus,
        verifyTimestamp: evidence.verifyTimestamp,
        readyForMinting,
        isImmutable: evidence.verifyStatus === 'ChittyVerified'
      });
    } catch (error) {
      console.error('ChittyVerify status error:', error);
      res.status(500).json({ message: "Failed to check ChittyVerify status" });
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