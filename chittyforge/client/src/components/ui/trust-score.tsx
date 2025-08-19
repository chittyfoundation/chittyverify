import { Card, CardContent } from "@/components/ui/card";
import type { User, VerificationMethod } from "@shared/schema";

interface TrustScoreProps {
  user: User;
  verifications: VerificationMethod[];
}

export default function TrustScore({ user, verifications }: TrustScoreProps) {
  const completedVerifications = verifications.filter(v => v.status === "completed");
  const identityScore = Math.min((completedVerifications.length / 4) * 100, 100);
  const accountAge = user.createdAt ? Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0;
  const ageScore = Math.min((accountAge / 365) * 100, 100);
  const activityScore = Math.min((user.trustScore || 0) / 10, 100);

  const overallScore = Math.round((identityScore + ageScore + activityScore) / 3);
  const scorePercentage = Math.min(user.trustScore / 10, 100);

  const getScoreGrade = (score: number) => {
    if (score >= 90) return "Excellent";
    if (score >= 80) return "Very Good";
    if (score >= 70) return "Good";
    if (score >= 60) return "Fair";
    return "Needs Improvement";
  };

  const getPercentile = (score: number) => {
    if (score >= 90) return "Top 5%";
    if (score >= 80) return "Top 15%";
    if (score >= 70) return "Top 30%";
    if (score >= 60) return "Top 50%";
    return "Bottom 50%";
  };

  return (
    <Card className="bg-dark-bg-800 border-slate-700/50">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">Trust Score</h3>
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-4">
            <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#334155"
                strokeWidth="3"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="url(#trustGradient)"
                strokeWidth="3"
                strokeDasharray={`${scorePercentage}, 100`}
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="trustGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="#0EA5E9" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold" data-testid="text-trust-score">
                {user.trustScore}
              </span>
            </div>
          </div>
          <p className="text-sm text-slate-400 mb-4" data-testid="text-trust-grade">
            {getScoreGrade(overallScore)} • {getPercentile(overallScore)}
          </p>
          <div className="space-y-2 text-left">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Identity Verification</span>
              <span className="text-mint-green-400" data-testid="text-identity-score">
                {Math.round(identityScore)}%
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Account Age</span>
              <span className="text-electric-blue-400" data-testid="text-age-score">
                {Math.round(ageScore)}%
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Activity Score</span>
              <span className="text-purple-400" data-testid="text-activity-score">
                {Math.round(activityScore)}%
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
