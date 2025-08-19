import { Card, CardContent } from "@/components/ui/card";
import type { Badge, UserBadge } from "@shared/schema";

interface BadgeGridProps {
  badges: (UserBadge & { badge: Badge })[];
}

const badgeColors: Record<string, string> = {
  "mint-green": "from-mint-green-500 to-mint-green-600",
  "electric-blue": "from-electric-blue-500 to-electric-blue-600",
  "purple": "from-purple-500 to-purple-600",
  "yellow": "from-yellow-500 to-orange-500",
  "pink": "from-pink-500 to-pink-600",
  "green": "from-green-500 to-green-600",
  "orange": "from-orange-500 to-orange-600",
  "red": "from-red-500 to-red-600",
};

const textColors: Record<string, string> = {
  "mint-green": "text-mint-green-400",
  "electric-blue": "text-electric-blue-400",
  "purple": "text-purple-400",
  "yellow": "text-yellow-400",
  "pink": "text-pink-400",
  "green": "text-green-400",
  "orange": "text-orange-400",
  "red": "text-red-400",
};

// Mock locked badges for demonstration
const mockLockedBadges = [
  { id: "locked-1", name: "ID Verified", icon: "fas fa-id-card", color: "orange" },
  { id: "locked-2", name: "Biometric", icon: "fas fa-fingerprint", color: "red" },
  { id: "locked-3", name: "Network Star", icon: "fas fa-star", color: "purple" },
  { id: "locked-4", name: "Community Helper", icon: "fas fa-hands-helping", color: "mint-green" },
];

export default function BadgeGrid({ badges }: BadgeGridProps) {
  const earnedBadges = badges || [];
  const totalBadges = earnedBadges.length + mockLockedBadges.length;

  return (
    <Card className="bg-dark-bg-800 border-slate-700/50">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Badge Collection</h2>
          <div className="text-sm text-slate-400">
            <span className="text-electric-blue-400 font-medium" data-testid="text-badges-earned">
              {earnedBadges.length}
            </span>{" "}
            of {totalBadges} earned
          </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {/* Earned Badges */}
          {earnedBadges.map((userBadge) => (
            <div 
              key={userBadge.id} 
              className="text-center group cursor-pointer"
              data-testid={`badge-earned-${userBadge.badge.name.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <div className={`w-16 h-16 bg-gradient-to-br ${badgeColors[userBadge.badge.color] || "from-gray-500 to-gray-600"} rounded-2xl flex items-center justify-center mb-2 group-hover:scale-105 transition-transform`}>
                <i className={`${userBadge.badge.icon} text-white text-xl`}></i>
              </div>
              <p className={`text-xs font-medium ${textColors[userBadge.badge.color] || "text-gray-400"}`}>
                {userBadge.badge.name}
              </p>
            </div>
          ))}

          {/* Locked Badges */}
          {mockLockedBadges.map((badge) => (
            <div 
              key={badge.id}
              className="text-center opacity-40"
              data-testid={`badge-locked-${badge.name.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <div className="w-16 h-16 bg-slate-600 rounded-2xl flex items-center justify-center mb-2">
                <i className={`${badge.icon} text-slate-400 text-xl`}></i>
              </div>
              <p className="text-xs text-slate-400 font-medium">{badge.name}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
