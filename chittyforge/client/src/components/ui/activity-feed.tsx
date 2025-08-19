import { Card, CardContent } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import type { ActivityLog } from "@shared/schema";

interface ActivityFeedProps {
  activities: ActivityLog[];
}

const getActivityIcon = (action: string) => {
  switch (action) {
    case "verification_completed": return "fas fa-check-circle";
    case "verification_started": return "fas fa-upload";
    case "badge_earned": return "fas fa-award";
    case "account_created": return "fas fa-user-plus";
    case "identity_shared": return "fas fa-share";
    default: return "fas fa-circle";
  }
};

const getActivityColor = (action: string) => {
  switch (action) {
    case "verification_completed": return "text-mint-green-500";
    case "verification_started": return "text-electric-blue-500";
    case "badge_earned": return "text-purple-500";
    case "account_created": return "text-yellow-500";
    case "identity_shared": return "text-pink-500";
    default: return "text-slate-500";
  }
};

const getDotColor = (action: string) => {
  switch (action) {
    case "verification_completed": return "bg-mint-green-500";
    case "verification_started": return "bg-electric-blue-500";
    case "badge_earned": return "bg-purple-500";
    case "account_created": return "bg-yellow-500";
    case "identity_shared": return "bg-pink-500";
    default: return "bg-slate-500";
  }
};

export default function ActivityFeed({ activities }: ActivityFeedProps) {
  if (!activities || activities.length === 0) {
    return (
      <Card className="bg-dark-bg-800 border-slate-700/50">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-6">Recent Activity</h2>
          <div className="text-center py-8">
            <i className="fas fa-clock text-4xl text-slate-600 mb-4"></i>
            <p className="text-slate-400">No recent activity to display</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-dark-bg-800 border-slate-700/50">
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold mb-6">Recent Activity</h2>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div 
              key={activity.id}
              className="flex items-center space-x-4 p-3 hover:bg-dark-bg-900/50 rounded-lg transition-colors"
              data-testid={`activity-${activity.action}`}
            >
              <div className={`w-2 h-2 ${getDotColor(activity.action)} rounded-full`}></div>
              <div className="flex-1">
                <p className="text-sm" data-testid={`activity-description-${activity.id}`}>
                  {activity.description}
                </p>
                <p className="text-xs text-slate-400" data-testid={`activity-time-${activity.id}`}>
                  {activity.createdAt ? formatDistanceToNow(activity.createdAt, { addSuffix: true }) : "Recently"}
                </p>
              </div>
              <i className={`${getActivityIcon(activity.action)} ${getActivityColor(activity.action)}`}></i>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
