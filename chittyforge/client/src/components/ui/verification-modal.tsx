import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
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

export default function VerificationModal({ isOpen, onClose }: VerificationModalProps) {
  const [chittyId, setChittyId] = useState("");
  const [result, setResult] = useState<VerificationResult | null>(null);
  const { toast } = useToast();

  const verifyMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("POST", "/api/verify-chittyid", { chittyId: id });
      return await response.json();
    },
    onSuccess: (data) => {
      setResult(data);
      toast({
        title: "Verification complete",
        description: `ChittyID ${data.chittyId} has been verified.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Verification failed",
        description: error.message || "Invalid ChittyID or verification failed.",
        variant: "destructive",
      });
      setResult(null);
    },
  });

  const handleVerify = () => {
    if (!chittyId.trim()) {
      toast({
        title: "Invalid input",
        description: "Please enter a valid ChittyID.",
        variant: "destructive",
      });
      return;
    }
    verifyMutation.mutate(chittyId.trim());
  };

  const handleClose = () => {
    setChittyId("");
    setResult(null);
    onClose();
  };

  const getTrustLevelColor = (level: number) => {
    if (level >= 4) return "text-mint-green-400";
    if (level >= 3) return "text-electric-blue-400";
    if (level >= 2) return "text-yellow-400";
    return "text-slate-400";
  };

  const getVerificationIcon = (type: string) => {
    switch (type) {
      case "email": return "fas fa-envelope";
      case "phone": return "fas fa-phone";
      case "government_id": return "fas fa-id-card";
      case "biometric": return "fas fa-fingerprint";
      default: return "fas fa-check";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-dark-bg-800 border-slate-700/50">
        <DialogHeader>
          <DialogTitle className="text-white">Verify ChittyID</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Input Section */}
          <div className="space-y-2">
            <Label htmlFor="chittyId" className="text-slate-400">Enter ChittyID</Label>
            <Input
              id="chittyId"
              value={chittyId}
              onChange={(e) => setChittyId(e.target.value)}
              placeholder="25-P-USR-8F4A-V-08-7-K"
              className="bg-dark-bg-900 border-slate-600 text-white placeholder-slate-500 focus:border-electric-blue-500 font-mono"
              data-testid="input-chitty-id"
            />
          </div>
          
          <Button
            onClick={handleVerify}
            disabled={verifyMutation.isPending}
            className="w-full bg-electric-blue-600 hover:bg-electric-blue-700 text-white"
            data-testid="button-verify-chitty-id"
          >
            {verifyMutation.isPending ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Verifying...
              </>
            ) : (
              <>
                <i className="fas fa-search mr-2"></i>
                Verify Identity
              </>
            )}
          </Button>

          {/* Loading State */}
          {verifyMutation.isPending && (
            <Card className="bg-dark-bg-900/50 border-slate-700/50">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-3/4 bg-slate-700" />
                  <Skeleton className="h-4 w-1/2 bg-slate-700" />
                  <Skeleton className="h-8 w-full bg-slate-700" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results Section */}
          {result && (
            <Card className="bg-dark-bg-900/50 border-slate-700/50">
              <CardContent className="p-4">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${result.isVerified ? 'bg-mint-green-500' : 'bg-yellow-500'}`}>
                      <i className={`fas ${result.isVerified ? 'fa-check' : 'fa-exclamation'} text-white text-xl`}></i>
                    </div>
                    <div>
                      <h3 className="font-semibold text-white" data-testid="text-verified-name">
                        {result.fullName || "Unknown User"}
                      </h3>
                      <p className="text-sm text-slate-400" data-testid="text-verified-chitty-id">
                        {result.chittyId}
                      </p>
                    </div>
                  </div>

                  {/* Trust Information */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className={`text-xl font-bold ${getTrustLevelColor(result.trustLevel)}`} data-testid="text-verified-trust-level">
                        L{result.trustLevel}
                      </div>
                      <div className="text-xs text-slate-400">Trust Level</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-electric-blue-400" data-testid="text-verified-trust-score">
                        {result.trustScore}
                      </div>
                      <div className="text-xs text-slate-400">Trust Score</div>
                    </div>
                  </div>

                  {/* Verification Status */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-400">Verifications</span>
                      <span className="text-sm font-medium text-white" data-testid="text-verified-count">
                        {result.verificationsCount} completed
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-400">Badges Earned</span>
                      <span className="text-sm font-medium text-white" data-testid="text-verified-badges">
                        {result.badgesCount}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-400">Status</span>
                      <span className={`text-sm font-medium ${result.isVerified ? 'text-mint-green-400' : 'text-yellow-400'}`} data-testid="text-verified-status">
                        {result.isVerified ? "Verified" : "Pending"}
                      </span>
                    </div>
                  </div>

                  {/* Verification Methods */}
                  {result.verifications.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-slate-300">Completed Verifications</h4>
                      <div className="space-y-1">
                        {result.verifications.map((verification, index) => (
                          <div key={index} className="flex items-center space-x-2 text-sm">
                            <i className={`${getVerificationIcon(verification.type)} text-mint-green-400`}></i>
                            <span className="text-slate-300 capitalize">
                              {verification.type.replace('_', ' ')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
