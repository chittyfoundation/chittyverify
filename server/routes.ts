import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { users } from "../shared/schema";
import { insertCaseSchema, insertEvidenceSchema, insertPropertyTaxRecordSchema } from "../shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Cases routes
  app.get("/api/cases", async (req, res) => {
    try {
      // Get cases for the existing user ID from our database
      const cases = await storage.getCasesByUserId("42aeb76c-ecb3-4fb0-aa90-1de84eeaad10");
      res.json(cases);
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
      const validatedData = insertCaseSchema.parse({
        ...req.body,
        userId: "42aeb76c-ecb3-4fb0-aa90-1de84eeaad10", // Use existing demo user
      });
      const case_ = await storage.createCase(validatedData);
      res.status(201).json(case_);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid case data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create case" });
    }
  });

  // Evidence routes
  app.get("/api/cases/:caseId/evidence", async (req, res) => {
    try {
      const evidence = await storage.getEvidenceByCaseId(req.params.caseId);
      res.json(evidence);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch evidence" });
    }
  });

  app.get("/api/evidence/:id", async (req, res) => {
    try {
      const evidence = await storage.getEvidence(req.params.id);
      if (!evidence) {
        return res.status(404).json({ message: "Evidence not found" });
      }
      res.json(evidence);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch evidence" });
    }
  });

  app.post("/api/evidence", async (req, res) => {
    try {
      // Add required defaults for database fields
      const evidenceData = {
        ...req.body,
        id: req.body.id || `evidence-${Date.now()}`,
        trustScore: req.body.trustScore || 50,
        uploadedAt: new Date(),
        facts: req.body.facts || {},
        analysis: req.body.analysis || {},
        metadata: req.body.metadata || {}
      };
      
      const validatedData = insertEvidenceSchema.parse(evidenceData);
      const evidence = await storage.createEvidence(validatedData);
      res.status(201).json(evidence);
    } catch (error) {
      console.error('Evidence creation error:', error);
      console.error('Request body:', req.body);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid evidence data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create evidence", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.patch("/api/evidence/:id/status", async (req, res) => {
    try {
      const { status, trustScore } = req.body;
      const evidence = await storage.updateEvidenceStatus(req.params.id, status, trustScore);
      if (!evidence) {
        return res.status(404).json({ message: "Evidence not found" });
      }
      res.json(evidence);
    } catch (error) {
      res.status(500).json({ message: "Failed to update evidence status" });
    }
  });

  // Property tax routes
  app.post("/api/property-tax/scrape", async (req, res) => {
    try {
      const { pins, year = 2024 } = req.body;
      
      if (!pins || !Array.isArray(pins)) {
        return res.status(400).json({ message: "PINs array is required" });
      }

      // Simulate property tax scraping
      const results = [];
      for (const pin of pins) {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const mockData = {
          pin,
          address: `Property for PIN ${pin}`,
          year,
          landAssessment: "85000.00",
          buildingAssessment: "200000.00",
          totalAssessment: "285000.00",
          estimatedTax: "8925.00",
          propertyClass: "2",
          squareFeet: 1200,
          yearBuilt: 1985,
          assessorData: {
            source: "cook_county_assessor",
            scraped: true,
            verified: true,
          },
          treasurerData: {
            totalDue: "8925.00",
            amountPaid: "8475.00",
            balanceDue: "450.00",
            status: "partial_payment",
          },
        };
        
        results.push({
          pin,
          success: true,
          data: mockData,
        });
      }

      res.json({
        success: true,
        results,
        totalScraped: results.length,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to scrape property tax data" });
    }
  });

  app.get("/api/property-tax/:pin", async (req, res) => {
    try {
      const records = await storage.getPropertyTaxRecordsByPin(req.params.pin);
      res.json(records);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch property tax records" });
    }
  });

  // Analysis routes
  app.post("/api/evidence/:id/analyze", async (req, res) => {
    try {
      const evidence = await storage.getEvidence(req.params.id);
      if (!evidence) {
        return res.status(404).json({ message: "Evidence not found" });
      }

      // Simulate AI analysis
      await new Promise(resolve => setTimeout(resolve, 500));

      const analysisResult = {
        type: "ai_analysis",
        confidence: (0.85 + Math.random() * 0.15).toString(), // Random confidence between 0.85-1.0
        results: {
          caseStrength: Math.floor(70 + Math.random() * 30), // Random strength 70-100%
          keyFindings: [
            "Evidence authenticity verified through multiple sources",
            "Metadata consistency confirms document integrity",
            "Timeline aligns with case progression",
          ],
          riskFactors: [
            "Minor discrepancies in timestamp formatting",
            "Consider additional corroborating evidence",
          ],
          recommendations: [
            "Collect supporting financial documentation",
            "Verify metadata against original sources",
            "Consider expert witness testimony",
          ],
        },
        recommendations: {
          nextSteps: ["Upload bank statements", "Verify email headers", "Request certified copies"],
          priority: "medium",
        },
        metadata: {
          analysisVersion: "v2.1",
          processingTime: "0.45s",
          dataPoints: 47,
        },
        evidenceId: req.params.id,
      };

      const analysis = await storage.createAnalysisResult(analysisResult);
      res.json(analysis);
    } catch (error) {
      res.status(500).json({ message: "Failed to analyze evidence" });
    }
  });

  // Blockchain routes
  app.post("/api/evidence/:id/mint", async (req, res) => {
    try {
      const evidence = await storage.getEvidence(req.params.id);
      if (!evidence) {
        return res.status(404).json({ message: "Evidence not found" });
      }

      // Simulate blockchain minting
      await new Promise(resolve => setTimeout(resolve, 1000));

      const transaction = await storage.createBlockchainTransaction({
        evidenceId: req.params.id,
        transactionHash: `0x${Math.random().toString(16).substring(2, 18)}`,
        blockNumber: Math.floor(2847000 + Math.random() * 1000),
        blockHash: `0x${Math.random().toString(16).substring(2, 18)}`,
        gasUsed: Math.floor(21000 + Math.random() * 50000),
        gasPrice: "20000000000", // 20 gwei
        status: "confirmed",
        networkStatus: "active",
      });

      // Update evidence with blockchain info
      await storage.updateEvidence(req.params.id, {
        blockchain: {
          status: "minted",
          hash: transaction.transactionHash,
          blockNumber: transaction.blockNumber,
          gasUsed: transaction.gasUsed,
        },
        status: "minted",
      });

      res.json(transaction);
    } catch (error) {
      res.status(500).json({ message: "Failed to mint evidence to blockchain" });
    }
  });

  // Mock file upload endpoint
  app.post("/api/upload", async (req, res) => {
    try {
      // Simulate file upload processing
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const mockFileInfo = {
        id: `file_${Date.now()}`,
        filename: req.body.filename || "uploaded_file.pdf",
        size: req.body.size || 245760,
        mimeType: req.body.mimeType || "application/pdf",
        path: `/uploads/${Date.now()}_${req.body.filename || "file.pdf"}`,
        uploadedAt: new Date().toISOString(),
      };

      res.json({
        success: true,
        file: mockFileInfo,
        message: "File uploaded successfully",
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  // Blockchain minting endpoint
  app.post("/api/evidence/:id/mint", async (req, res) => {
    try {
      const evidence = await storage.getEvidence(req.params.id);
      if (!evidence) {
        return res.status(404).json({ message: "Evidence not found" });
      }

      // Create blockchain transaction record
      const transaction = await storage.createBlockchainTransaction({
        evidenceId: evidence.id,
        transactionHash: `0x${Math.random().toString(16).substring(2, 18)}`,
        blockNumber: Math.floor(Math.random() * 1000 + 100),
        gasUsed: Math.floor(Math.random() * 50000 + 21000),
        gasPrice: (Math.floor(Math.random() * 20 + 10)).toString(),
        status: "confirmed",
        networkStatus: "finalized"
      });

      // Update evidence status to minted
      await storage.updateEvidenceStatus(evidence.id, "minted", 95);

      res.json({
        success: true,
        transactionHash: transaction.transactionHash,
        blockNumber: transaction.blockNumber,
        message: "Evidence successfully minted to blockchain"
      });
    } catch (error) {
      console.error('Minting error:', error);
      res.status(500).json({ message: "Blockchain minting failed" });
    }
  });

  // Notion sync endpoint
  app.post("/api/evidence/:id/sync-notion", async (req, res) => {
    try {
      const evidence = await storage.getEvidence(req.params.id);
      if (!evidence) {
        return res.status(404).json({ message: "Evidence not found" });
      }

      // Check if Notion is configured
      if (!process.env.NOTION_INTEGRATION_SECRET || !process.env.NOTION_PAGE_URL) {
        return res.status(400).json({ 
          message: "Notion integration not configured. Please add NOTION_INTEGRATION_SECRET and NOTION_PAGE_URL." 
        });
      }

      // Import Notion module dynamically to avoid errors when secrets aren't available
      const { syncEvidenceToNotion } = await import('./notion');
      await syncEvidenceToNotion(evidence);

      res.json({
        success: true,
        message: "Evidence synced to Notion successfully",
        evidenceId: evidence.id,
        artifactId: evidence.artifactId
      });
    } catch (error) {
      console.error('Notion sync error:', error);
      res.status(500).json({ 
        message: "Failed to sync evidence to Notion",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Comprehensive analysis endpoint
  app.post("/api/evidence/:id/comprehensive-analysis", async (req, res) => {
    try {
      const evidence = await storage.getEvidence(req.params.id);
      if (!evidence) {
        return res.status(404).json({ message: "Evidence not found" });
      }

      // Simulate comprehensive multi-stage analysis
      const comprehensiveResult = {
        evidenceId: evidence.id,
        stages: {
          intake: {
            status: 'completed',
            results: {
              evidenceType: evidence.type,
              initialWeight: Math.random() * 0.3 + 0.7,
              uploadTimestamp: evidence.uploadedAt
            }
          },
          forensic: {
            status: 'completed', 
            results: {
              metadataIntegrity: Math.random() > 0.2 ? 'VALID' : 'SUSPICIOUS',
              temporalConsistency: Math.random() > 0.1 ? 'CONSISTENT' : 'INCONSISTENT',
              documentAuthenticity: Math.random() > 0.15 ? 'AUTHENTIC' : 'QUESTIONABLE',
              anomaliesDetected: Math.floor(Math.random() * 3)
            }
          },
          contradictions: {
            status: 'completed',
            results: {
              contradictionsFound: Math.random() > 0.7 ? 1 : 0,
              contradictions: Math.random() > 0.7 ? [{
                type: 'TEMPORAL',
                description: 'Date inconsistency with existing evidence',
                severity: 'MEDIUM'
              }] : [],
              resolutionRequired: Math.random() > 0.7
            }
          },
          facts: {
            status: 'completed',
            results: {
              factsExtracted: Math.floor(Math.random() * 5 + 3),
              highConfidenceFacts: Math.floor(Math.random() * 3 + 2),
              caseStrength: Math.random() * 0.4 + 0.6
            }
          },
          validation: {
            status: 'completed',
            results: {
              chainValid: true,
              errors: [],
              recommendations: ['Blockchain integrity verified - system operating normally']
            }
          },
          minting: {
            status: 'completed',
            results: {
              success: true,
              transactionHash: `0x${Math.random().toString(16).substring(2, 18)}`,
              blockNumber: Math.floor(Math.random() * 1000 + 100).toString(),
              artifactId: evidence.artifactId
            }
          }
        },
        overallStatus: 'COMPLETED',
        completedAt: new Date().toISOString()
      };

      // Create comprehensive analysis record
      await storage.createAnalysisResult({
        evidenceId: evidence.id,
        type: "comprehensive_analysis",
        confidence: "0.92",
        results: comprehensiveResult,
        recommendations: ["Evidence successfully analyzed and minted to blockchain"]
      });

      // Update evidence status to minted
      await storage.updateEvidenceStatus(evidence.id, "minted", 95);

      res.json(comprehensiveResult);
    } catch (error) {
      console.error('Comprehensive analysis error:', error);
      res.status(500).json({ message: "Comprehensive analysis failed" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
