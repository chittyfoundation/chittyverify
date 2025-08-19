import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import QRModal from "@/components/ui/qr-modal";
import { useToast } from "@/hooks/use-toast";
import type { User, VerificationMethod, UserBadge, Badge } from "@shared/schema";

interface IdentityCardProps {
  user: User;
  verifications: VerificationMethod[];
  badges: (UserBadge & { badge: Badge })[];
}

export default function IdentityCard({ user, verifications, badges }: IdentityCardProps) {
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const { toast } = useToast();

  const completedVerifications = verifications.filter(v => v.status === "completed").length;
  const maxVerifications = 5;
  const verificationDots = Array.from({ length: maxVerifications }, (_, i) => i < completedVerifications);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${user.fullName || user.username}'s ChittyID`,
          text: `Verify my identity with ChittyID: ${user.chittyId}`,
          url: window.location.href,
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback to copying to clipboard
      try {
        await navigator.clipboard.writeText(`${user.chittyId} - Verify at ${window.location.origin}`);
        toast({
          title: "Copied to clipboard",
          description: "Your ChittyID share link has been copied.",
        });
      } catch (error) {
        toast({
          title: "Share failed",
          description: "Unable to share your identity. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <>
      <Card className="bg-dark-bg-800 border-slate-700/50">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Your Identity Card</h3>
          <div className="bg-gradient-to-br from-electric-blue-600 to-mint-green-600 rounded-xl p-4 text-white">
            <div className="flex justify-between items-start mb-4">
              <div>
                <img 
                  src={user.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=60&h=60"} 
                  alt={`${user.fullName || user.username} Profile`} 
                  className="w-12 h-12 rounded-full border-2 border-white/30 mb-2"
                  data-testid="img-identity-avatar"
                />
                <h4 className="font-semibold" data-testid="text-identity-name">
                  {user.fullName || user.username}
                </h4>
                <p className="text-xs opacity-80" data-testid="text-identity-trust-level">
                  Trust Level L{user.trustLevel}
                </p>
              </div>
              <div className="text-right">
                <div className="text-xs opacity-80">ChittyID</div>
                <div className="font-mono text-sm" data-testid="text-identity-chitty-id">
                  {user.chittyId?.split('-').slice(0, 4).join('-')}
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex space-x-1">
                {verificationDots.map((isCompleted, index) => (
                  <div 
                    key={index}
                    className={`w-2 h-2 rounded-full ${isCompleted ? 'bg-white' : 'bg-white/40'}`}
                    data-testid={`dot-verification-${index}`}
                  />
                ))}
              </div>
              <div className="text-xs" data-testid="text-verification-status">
                {completedVerifications >= 2 ? "Verified" : "In Progress"}
              </div>
            </div>
          </div>
          <div className="mt-4 flex space-x-2">
            <Button 
              onClick={handleShare}
              className="flex-1 bg-electric-blue-600 hover:bg-electric-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
              data-testid="button-share-identity"
            >
              <i className="fas fa-share mr-2"></i>Share
            </Button>
            <Button 
              onClick={() => setIsQRModalOpen(true)}
              variant="outline"
              className="flex-1 bg-dark-bg-900 hover:bg-slate-700 border border-slate-600 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
              data-testid="button-qr-code"
            >
              <i className="fas fa-qrcode mr-2"></i>QR Code
            </Button>
          </div>
        </CardContent>
      </Card>

      <QRModal 
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        user={user}
      />
    </>
  );
}
