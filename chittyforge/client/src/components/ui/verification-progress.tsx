import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { VerificationMethod } from "@shared/schema";

interface VerificationProgressProps {
  verifications: VerificationMethod[];
}

const verificationTypes = [
  { type: "email", label: "Email Verification", icon: "fas fa-envelope", description: "Email address verified" },
  { type: "phone", label: "Phone Verification", icon: "fas fa-phone", description: "Phone number verified" },
  { type: "government_id", label: "Government ID", icon: "fas fa-id-card", description: "Documents submitted for review" },
  { type: "biometric", label: "Biometric Verification", icon: "fas fa-fingerprint", description: "Complete Government ID first" },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "completed": return { bg: "bg-mint-green-500", text: "text-mint-green-400", badge: "bg-mint-green-500/20" };
    case "in_review": return { bg: "bg-electric-blue-500", text: "text-electric-blue-400", badge: "bg-electric-blue-500/20" };
    case "failed": return { bg: "bg-red-500", text: "text-red-400", badge: "bg-red-500/20" };
    default: return { bg: "bg-slate-600", text: "text-slate-400", badge: "bg-slate-600/20" };
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "completed": return "fas fa-check";
    case "in_review": return "fas fa-spinner fa-spin";
    case "failed": return "fas fa-times";
    default: return "fas fa-lock";
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "completed": return "Completed";
    case "in_review": return "In Review";
    case "failed": return "Failed";
    case "pending": return "Pending";
    default: return "Locked";
  }
};

export default function VerificationProgress({ verifications }: VerificationProgressProps) {
  const verificationMap = new Map(verifications.map(v => [v.type, v]));

  return (
    <Card className="bg-dark-bg-800 border-slate-700/50 animate-slide-up">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Verification Progress</h2>
          <Button 
            variant="ghost" 
            className="text-electric-blue-400 hover:text-electric-blue-300 text-sm font-medium"
            data-testid="button-view-all-verifications"
          >
            View All <i className="fas fa-arrow-right ml-1"></i>
          </Button>
        </div>
        
        <div className="space-y-4">
          {verificationTypes.map((vType) => {
            const verification = verificationMap.get(vType.type);
            const status = verification?.status || (vType.type === "biometric" ? "locked" : "pending");
            const colors = getStatusColor(status);
            const isLocked = status === "locked" || (vType.type === "biometric" && !verificationMap.get("government_id"));
            
            return (
              <div 
                key={vType.type}
                className={`flex items-center space-x-4 p-4 bg-dark-bg-900/50 rounded-xl ${isLocked ? 'opacity-60' : ''}`}
                data-testid={`verification-${vType.type}`}
              >
                <div className={`w-10 h-10 ${colors.bg} rounded-full flex items-center justify-center ${status === "in_review" ? "animate-pulse-slow" : ""}`}>
                  <i className={`${getStatusIcon(status)} text-white`}></i>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{vType.label}</h3>
                    <span className={`text-xs ${colors.badge} ${colors.text} px-2 py-1 rounded-full`}>
                      {getStatusLabel(status)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400">
                    {vType.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
