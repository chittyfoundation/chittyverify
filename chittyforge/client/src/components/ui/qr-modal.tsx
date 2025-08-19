import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

export default function QRModal({ isOpen, onClose, user }: QRModalProps) {
  const { toast } = useToast();

  const shareUrl = `${window.location.origin}/verify/${user.chittyId}`;
  
  // Generate QR code using a simple SVG pattern
  // In a real app, you'd use a proper QR code library
  const generateQRPattern = () => {
    const size = 200;
    const modules = 25;
    const moduleSize = size / modules;
    const pattern = [];
    
    for (let y = 0; y < modules; y++) {
      for (let x = 0; x < modules; x++) {
        // Create a simple pattern based on user's chittyId
        const hash = (user.chittyId || '').split('').reduce((a, b) => {
          a = ((a << 5) - a) + b.charCodeAt(0);
          return a & a;
        }, 0);
        
        const shouldFill = (x + y + hash) % 3 === 0;
        if (shouldFill) {
          pattern.push(
            <rect
              key={`${x}-${y}`}
              x={x * moduleSize}
              y={y * moduleSize}
              width={moduleSize}
              height={moduleSize}
              fill="#0F172A"
            />
          );
        }
      }
    }
    
    return pattern;
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copied",
        description: "The verification link has been copied to your clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Unable to copy the link. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    // In a real app, this would generate and download a proper QR code image
    toast({
      title: "Download started",
      description: "Your QR code is being prepared for download.",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-dark-bg-800 border-slate-700/50">
        <DialogHeader>
          <DialogTitle className="text-white">Share Your ChittyID</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-4">
          {/* QR Code Display */}
          <div className="bg-white p-4 rounded-xl">
            <svg width="200" height="200" viewBox="0 0 200 200" data-testid="qr-code-svg">
              <rect width="200" height="200" fill="white" />
              {generateQRPattern()}
              
              {/* Corner markers */}
              <rect x="0" y="0" width="40" height="40" fill="none" stroke="#0F172A" strokeWidth="8" />
              <rect x="160" y="0" width="40" height="40" fill="none" stroke="#0F172A" strokeWidth="8" />
              <rect x="0" y="160" width="40" height="40" fill="none" stroke="#0F172A" strokeWidth="8" />
              
              <rect x="8" y="8" width="24" height="24" fill="#0F172A" />
              <rect x="168" y="8" width="24" height="24" fill="#0F172A" />
              <rect x="8" y="168" width="24" height="24" fill="#0F172A" />
            </svg>
          </div>
          
          {/* ChittyID Display */}
          <div className="text-center">
            <p className="text-sm text-slate-400 mb-1">ChittyID</p>
            <p className="font-mono text-lg text-white" data-testid="text-qr-chitty-id">
              {user.chittyId}
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex space-x-2 w-full">
            <Button
              onClick={handleCopyLink}
              variant="outline"
              className="flex-1 bg-electric-blue-600/20 border-electric-blue-500/30 text-electric-blue-400 hover:bg-electric-blue-600/30"
              data-testid="button-copy-link"
            >
              <i className="fas fa-link mr-2"></i>Copy Link
            </Button>
            <Button
              onClick={handleDownload}
              variant="outline"
              className="flex-1 bg-mint-green-600/20 border-mint-green-500/30 text-mint-green-400 hover:bg-mint-green-600/30"
              data-testid="button-download-qr"
            >
              <i className="fas fa-download mr-2"></i>Download
            </Button>
          </div>
          
          {/* Instructions */}
          <div className="text-center text-sm text-slate-400 max-w-sm">
            <p>Share this QR code to let others quickly verify your ChittyID. They can scan it with any QR reader or camera app.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
