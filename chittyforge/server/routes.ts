import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, verifyChittyIdSchema, updateVerificationSchema, 
  createShareSchema, insertVerificationSchema, blockchainVerifySchema,
  createEndorsementSchema, biometricVerifySchema, mintBadgeNftSchema 
} from "@shared/schema";
// Temporary simple hash function - in production use proper bcrypt
const simpleHash = (password: string): string => {
  return Buffer.from(password).toString('base64');
};

const verifyPassword = (password: string, hash: string): boolean => {
  return Buffer.from(password).toString('base64') === hash;
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Hash password
      const hashedPassword = simpleHash(userData.password);
      
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      // Don't return password in response
      const { password, ...userResponse } = user;
      res.json(userResponse);
    } catch (error) {
      res.status(400).json({ message: "Invalid user data", error });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = verifyPassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Don't return password in response
      const { password: _, ...userResponse } = user;
      res.json(userResponse);
    } catch (error) {
      res.status(500).json({ message: "Login failed", error });
    }
  });

  // User profile routes
  app.get("/api/user/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password, ...userResponse } = user;
      res.json(userResponse);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user", error });
    }
  });

  app.get("/api/user/:id/dashboard", async (req, res) => {
    try {
      const userId = req.params.id;
      
      const [user, verifications, badges, activities, networkStats] = await Promise.all([
        storage.getUser(userId),
        storage.getVerificationMethods(userId),
        storage.getUserBadges(userId),
        storage.getActivityLogs(userId),
        storage.getNetworkStats(),
      ]);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password, ...userResponse } = user;
      
      res.json({
        user: userResponse,
        verifications,
        badges,
        activities,
        networkStats,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get dashboard data", error });
    }
  });

  // Verification routes
  app.post("/api/verifications", async (req, res) => {
    try {
      const verificationData = insertVerificationSchema.parse(req.body);
      const verification = await storage.createVerificationMethod(verificationData);
      res.json(verification);
    } catch (error) {
      res.status(400).json({ message: "Invalid verification data", error });
    }
  });

  app.put("/api/verifications/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = updateVerificationSchema.parse(req.body);
      
      const verification = await storage.updateVerificationMethod(id, updates);
      res.json(verification);
    } catch (error) {
      res.status(400).json({ message: "Failed to update verification", error });
    }
  });

  // Badge routes
  app.get("/api/badges", async (req, res) => {
    try {
      const badges = await storage.getAllBadges();
      res.json(badges);
    } catch (error) {
      res.status(500).json({ message: "Failed to get badges", error });
    }
  });

  // ChittyID verification route
  app.post("/api/verify-chittyid", async (req, res) => {
    try {
      const { chittyId } = verifyChittyIdSchema.parse(req.body);
      
      const user = await storage.getUserByChittyId(chittyId);
      if (!user) {
        return res.status(404).json({ message: "ChittyID not found" });
      }

      const [verifications, badges] = await Promise.all([
        storage.getVerificationMethods(user.id),
        storage.getUserBadges(user.id),
      ]);

      const completedVerifications = verifications.filter(v => v.status === "completed");

      res.json({
        chittyId: user.chittyId,
        fullName: user.fullName,
        trustLevel: user.trustLevel,
        trustScore: user.trustScore,
        verificationsCount: completedVerifications.length,
        badgesCount: badges.length,
        isVerified: completedVerifications.length >= 2,
        verifications: completedVerifications.map(v => ({
          type: v.type,
          completedAt: v.completedAt,
        })),
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid ChittyID format", error });
    }
  });

  // Identity sharing routes
  app.post("/api/user/:id/share", async (req, res) => {
    try {
      const userId = req.params.id;
      const { isPublic, expiresInDays } = createShareSchema.parse(req.body);
      
      const expiresAt = expiresInDays 
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
        : undefined;

      const share = await storage.createIdentityShare(userId, isPublic, expiresAt);
      res.json(share);
    } catch (error) {
      res.status(400).json({ message: "Failed to create share", error });
    }
  });

  app.get("/api/share/:token", async (req, res) => {
    try {
      const share = await storage.getIdentityShare(req.params.token);
      if (!share) {
        return res.status(404).json({ message: "Share not found or expired" });
      }

      const [verifications, badges] = await Promise.all([
        storage.getVerificationMethods(share.user.id),
        storage.getUserBadges(share.user.id),
      ]);

      const { password, ...userResponse } = share.user;
      
      res.json({
        user: userResponse,
        verifications: verifications.filter(v => v.status === "completed"),
        badges,
        share: {
          isPublic: share.isPublic,
          createdAt: share.createdAt,
        },
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get shared identity", error });
    }
  });

  // Network stats route
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getNetworkStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get stats", error });
    }
  });

  // Blockchain verification routes
  app.post("/api/user/:id/verify-blockchain", async (req, res) => {
    try {
      const userId = req.params.id;
      const { walletAddress, chainId, signature } = blockchainVerifySchema.parse(req.body);
      
      const isValid = await storage.verifyBlockchainAddress(walletAddress, signature);
      if (!isValid) {
        return res.status(400).json({ message: "Invalid blockchain signature" });
      }

      const verification = await storage.createBlockchainVerification({
        userId,
        walletAddress,
        chainId,
        transactionHash: null,
        blockNumber: null,
        verified: true,
      });

      res.json(verification);
    } catch (error) {
      res.status(400).json({ message: "Blockchain verification failed", error });
    }
  });

  app.get("/api/user/:id/blockchain-verifications", async (req, res) => {
    try {
      const verifications = await storage.getBlockchainVerifications(req.params.id);
      res.json(verifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to get blockchain verifications", error });
    }
  });

  // Social endorsement routes
  app.post("/api/user/:id/endorse", async (req, res) => {
    try {
      const endorserId = req.params.id;
      const endorsementData = createEndorsementSchema.parse(req.body);
      
      const endorsement = await storage.createEndorsement({
        ...endorsementData,
        endorserId,
        trustWeight: 1,
      });

      res.json(endorsement);
    } catch (error) {
      res.status(400).json({ message: "Failed to create endorsement", error });
    }
  });

  app.get("/api/user/:id/endorsements", async (req, res) => {
    try {
      const userId = req.params.id;
      const [receivedEndorsements, givenEndorsements] = await Promise.all([
        storage.getEndorsementsFor(userId),
        storage.getEndorsementsBy(userId),
      ]);

      res.json({
        received: receivedEndorsements,
        given: givenEndorsements,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get endorsements", error });
    }
  });

  // Biometric verification routes
  app.post("/api/user/:id/verify-biometric", async (req, res) => {
    try {
      const userId = req.params.id;
      const { biometricType, templateData, provider } = biometricVerifySchema.parse(req.body);
      
      // Check if this is a new registration or verification
      const existingBiometric = await storage.getBiometricData(userId);
      const isExisting = existingBiometric.some(b => b.biometricType === biometricType);
      
      if (isExisting) {
        // Verify against existing biometric
        const isValid = await storage.verifyBiometric(userId, templateData, biometricType);
        if (!isValid) {
          return res.status(400).json({ message: "Biometric verification failed" });
        }
        res.json({ verified: true, message: "Biometric verified successfully" });
      } else {
        // Register new biometric
        const templateHash = Buffer.from(templateData).toString('base64'); // Simple hash for demo
        const biometric = await storage.createBiometricRecord({
          userId,
          biometricType,
          templateHash,
          provider: provider || "ChittyID",
          confidenceScore: 95,
          verified: true,
          lastVerified: new Date(),
        });
        res.json(biometric);
      }
    } catch (error) {
      res.status(400).json({ message: "Biometric processing failed", error });
    }
  });

  app.get("/api/user/:id/biometric-data", async (req, res) => {
    try {
      const biometricData = await storage.getBiometricData(req.params.id);
      res.json(biometricData);
    } catch (error) {
      res.status(500).json({ message: "Failed to get biometric data", error });
    }
  });

  // NFT badge minting route
  app.post("/api/badges/:badgeId/mint", async (req, res) => {
    try {
      const { badgeId } = req.params;
      const { walletAddress } = mintBadgeNftSchema.parse(req.body);
      
      // Simulate NFT minting process
      const transactionHash = `0x${Array.from({ length: 64 }, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('')}`;
      
      res.json({
        success: true,
        badgeId,
        walletAddress,
        transactionHash,
        message: "NFT badge minted successfully",
      });
    } catch (error) {
      res.status(400).json({ message: "Failed to mint NFT badge", error });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
