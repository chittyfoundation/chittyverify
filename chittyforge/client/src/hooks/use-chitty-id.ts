import { useState, useCallback } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { User, VerificationMethod, UserBadge, Badge, ActivityLog } from "@shared/schema";

interface DashboardData {
  user: User;
  verifications: VerificationMethod[];
  badges: (UserBadge & { badge: Badge })[];
  activities: ActivityLog[];
  networkStats: {
    activeUsers: number;
    verificationsToday: number;
    trustTransactions: number;
  };
}

interface VerificationResult {
  chittyId: string;
  fullName: string;
  trustLevel: number;
  trustScore: number;
  verificationsCount: number;
  badgesCount: number;
  isVerified: boolean;
  verifications: Array<{
    type: string;
    completedAt: string;
  }>;
}

export function useChittyId(userId?: string) {
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);

  // Fetch dashboard data
  const dashboardQuery = useQuery<DashboardData>({
    queryKey: ["/api/user", userId, "dashboard"],
    enabled: !!userId,
  });

  // Verify ChittyID mutation
  const verifyChittyIdMutation = useMutation({
    mutationFn: async (chittyId: string): Promise<VerificationResult> => {
      const response = await apiRequest("POST", "/api/verify-chittyid", { chittyId });
      return await response.json();
    },
    onSuccess: (data) => {
      setVerificationResult(data);
    },
    onError: () => {
      setVerificationResult(null);
    },
  });

  // Create identity share mutation
  const createShareMutation = useMutation({
    mutationFn: async ({ userId, isPublic, expiresInDays }: { 
      userId: string; 
      isPublic: boolean; 
      expiresInDays?: number; 
    }) => {
      const response = await apiRequest("POST", `/api/user/${userId}/share`, {
        isPublic,
        expiresInDays,
      });
      return await response.json();
    },
  });

  // Start verification mutation
  const startVerificationMutation = useMutation({
    mutationFn: async ({ userId, type, data }: {
      userId: string;
      type: string;
      data?: Record<string, any>;
    }) => {
      const response = await apiRequest("POST", "/api/verifications", {
        userId,
        type,
        data,
      });
      return await response.json();
    },
  });

  const verifyChittyId = useCallback((chittyId: string) => {
    verifyChittyIdMutation.mutate(chittyId);
  }, [verifyChittyIdMutation]);

  const createShare = useCallback((userId: string, isPublic: boolean, expiresInDays?: number) => {
    return createShareMutation.mutateAsync({ userId, isPublic, expiresInDays });
  }, [createShareMutation]);

  const startVerification = useCallback((userId: string, type: string, data?: Record<string, any>) => {
    return startVerificationMutation.mutateAsync({ userId, type, data });
  }, [startVerificationMutation]);

  return {
    // Data
    dashboardData: dashboardQuery.data,
    verificationResult,
    
    // Loading states
    isDashboardLoading: dashboardQuery.isLoading,
    isVerifying: verifyChittyIdMutation.isPending,
    isCreatingShare: createShareMutation.isPending,
    isStartingVerification: startVerificationMutation.isPending,
    
    // Error states
    dashboardError: dashboardQuery.error,
    verificationError: verifyChittyIdMutation.error,
    shareError: createShareMutation.error,
    verificationStartError: startVerificationMutation.error,
    
    // Actions
    verifyChittyId,
    createShare,
    startVerification,
    clearVerificationResult: () => setVerificationResult(null),
    
    // Refetch
    refetchDashboard: dashboardQuery.refetch,
  };
}

export type { DashboardData, VerificationResult };
