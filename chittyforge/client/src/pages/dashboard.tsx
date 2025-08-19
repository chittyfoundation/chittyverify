import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Header from "@/components/layout/header";
import VerificationProgress from "@/components/ui/verification-progress";
import BadgeGrid from "@/components/ui/badge-grid";
import IdentityCard from "@/components/ui/identity-card";
import TrustScore from "@/components/ui/trust-score";
import ActivityFeed from "@/components/ui/activity-feed";
import VerificationModal from "@/components/ui/verification-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Mock user ID for demo - in a real app this would come from auth context
const DEMO_USER_ID = "demo-user-123";

export default function Dashboard() {
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/user", DEMO_USER_ID, "dashboard"],
    enabled: !!DEMO_USER_ID,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-bg-950">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            <Skeleton className="h-32 w-full bg-dark-bg-800" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <Skeleton className="h-64 w-full bg-dark-bg-800" />
                <Skeleton className="h-48 w-full bg-dark-bg-800" />
              </div>
              <div className="space-y-6">
                <Skeleton className="h-48 w-full bg-dark-bg-800" />
                <Skeleton className="h-64 w-full bg-dark-bg-800" />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark-bg-950">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="bg-dark-bg-800 border-red-500/20">
            <CardContent className="pt-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-red-400 mb-2">Error Loading Dashboard</h2>
                <p className="text-slate-400">Unable to load your ChittyID dashboard. Please try again later.</p>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-dark-bg-950">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="bg-dark-bg-800 border-slate-700/50">
            <CardContent className="pt-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold mb-2">No Data Available</h2>
                <p className="text-slate-400 mb-4">Your ChittyID dashboard is not ready yet.</p>
                <Button 
                  onClick={() => window.location.reload()}
                  className="bg-electric-blue-500 hover:bg-electric-blue-600"
                  data-testid="button-reload"
                >
                  Reload Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const { user, verifications, badges, activities, networkStats } = data;

  return (
    <div className="min-h-screen bg-dark-bg-950">
      <Header user={user} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <section className="mb-8 animate-fade-in">
          <div className="bg-gradient-to-r from-electric-blue-600/20 to-mint-green-600/20 rounded-2xl p-6 border border-electric-blue-500/20">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-2xl font-bold mb-2" data-testid="text-welcome">
                  Welcome back, {user.fullName || user.username}!
                </h1>
                <p className="text-slate-400">
                  Your ChittyID: <span className="text-electric-blue-400 font-mono" data-testid="text-chitty-id">{user.chittyId}</span>
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-mint-green-400" data-testid="text-trust-level">
                    L{user.trustLevel}
                  </div>
                  <div className="text-xs text-slate-400">Trust Level</div>
                </div>
                <div className="w-16 h-16 relative">
                  <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#334155"
                      strokeWidth="2"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="2"
                      strokeDasharray={`${Math.min(user.trustScore / 10, 100)}, 100`}
                      className="animate-pulse-slow"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold" data-testid="text-trust-percentage">
                      {Math.min(Math.round(user.trustScore / 10), 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Dashboard */}
          <div className="lg:col-span-2 space-y-6">
            <VerificationProgress verifications={verifications} />
            <BadgeGrid badges={badges} />
            <ActivityFeed activities={activities} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <IdentityCard user={user} verifications={verifications} badges={badges} />
            <TrustScore user={user} verifications={verifications} />
            
            {/* Quick Actions */}
            <Card className="bg-dark-bg-800 border-slate-700/50">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Button
                    onClick={() => setIsVerificationModalOpen(true)}
                    className="w-full bg-electric-blue-600/20 hover:bg-electric-blue-600/30 border border-electric-blue-500/30 text-electric-blue-400 justify-start"
                    variant="outline"
                    data-testid="button-verify-id"
                  >
                    <i className="fas fa-search mr-3"></i>
                    Verify Another ID
                  </Button>
                  <Button
                    className="w-full bg-mint-green-600/20 hover:bg-mint-green-600/30 border border-mint-green-500/30 text-mint-green-400 justify-start"
                    variant="outline"
                    data-testid="button-add-verification"
                  >
                    <i className="fas fa-plus mr-3"></i>
                    Add Verification Method
                  </Button>
                  <Button
                    className="w-full bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-400 justify-start"
                    variant="outline"
                    data-testid="button-export-data"
                  >
                    <i className="fas fa-download mr-3"></i>
                    Export Identity Data
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Network Stats */}
            <Card className="bg-dark-bg-800 border-slate-700/50">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Network Stats</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Active Users</span>
                    <span className="text-white font-semibold" data-testid="text-active-users">
                      {networkStats.activeUsers.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">IDs Verified Today</span>
                    <span className="text-mint-green-400 font-semibold" data-testid="text-verifications-today">
                      {networkStats.verificationsToday.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Trust Transactions</span>
                    <span className="text-electric-blue-400 font-semibold" data-testid="text-trust-transactions">
                      {(networkStats.trustTransactions / 1000).toFixed(0)}K
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Your Rank</span>
                    <span className="text-purple-400 font-semibold" data-testid="text-user-rank">
                      #{Math.floor(Math.random() * 10000) + 1000}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <VerificationModal 
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
      />

      {/* Floating Action Button */}
      <Button
        onClick={() => setIsVerificationModalOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-electric-blue-500 to-mint-green-500 rounded-full p-0 shadow-2xl hover:scale-105 transition-transform z-40"
        data-testid="button-fab-verify"
      >
        <i className="fas fa-search text-xl"></i>
      </Button>
    </div>
  );
}
