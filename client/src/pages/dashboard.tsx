import { useQuery } from "@tanstack/react-query";
import SixDTrustWidget from "@/components/trust/SixDTrustWidget";
import { Navigation } from "@/components/ui/navigation";
import { Footer } from "@/components/ui/footer";
import ChittyVerifyWidget from "@/components/verify/ChittyVerifyWidget";
import BatchUploadWidget from "@/components/upload/BatchUploadWidget";
import AdaptiveVerificationFlow from "@/components/verification/AdaptiveVerificationFlow";
import OneClickAuthentication from "@/components/authentication/OneClickAuthentication";
import { EvidenceCard } from "@/components/ui/evidence-card";
import { QuickUpload } from "@/components/ui/quick-upload";
import { ProgressIndicator } from "@/components/ui/progress-indicator";
import { CaseOverview } from "@/components/ui/case-overview";
import { AIAnalysis } from "@/components/ui/ai-analysis";
import { ChainStatus } from "@/components/ui/chain-status";
import { ComprehensiveAnalyzer } from "@/components/evidence/ComprehensiveAnalyzer";
import { Button } from "@/components/ui/button";
import { Search, Filter, SortAsc } from "lucide-react";
import { useState } from "react";

export default function Dashboard() {
  const [selectedCaseId, setSelectedCaseId] = useState<string>("case-1");

  const { data: cases, isLoading: casesLoading } = useQuery({
    queryKey: ["/api/cases"],
  });

  const { data: currentCase } = useQuery({
    queryKey: ["/api/cases", selectedCaseId],
    enabled: !!selectedCaseId,
  });

  const { data: evidence, isLoading: evidenceLoading } = useQuery({
    queryKey: ["/api/cases", selectedCaseId, "evidence"],
    enabled: !!selectedCaseId,
  });

  if (casesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-lg">Loading cases...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 bg-noise">
      <Navigation />

      {/* Hero Section - ChittyTrust Sibling Style */}
      <section className="py-20 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.1),transparent_50%)]"></div>
          <div className="absolute inset-0 bg-noise opacity-10"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center text-white">
            <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
              The Evidence
              <span className="block bg-gradient-to-r from-green-400 via-emerald-500 to-green-600 bg-clip-text text-transparent">
                Verification
              </span>
              <span className="block text-4xl md:text-5xl font-light text-slate-300">
                Revolution
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 mb-12 max-w-4xl mx-auto leading-relaxed">
              Beyond simple uploads. Beyond basic validation. ChittyVerify creates immutable verification layers 
              with cryptographic proof: <strong className="text-green-400">Source, Time, Integrity, Chain of Custody, Trust, and Justice</strong>.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <div className="flex items-center gap-4 text-3xl font-bold text-white">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
                  6
                </div>
                <span>Verification Layers</span>
              </div>
              <div className="flex items-center gap-4 text-3xl font-bold text-white">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-cyan-600 flex items-center justify-center">
                  4
                </div>
                <span>Proof Types</span>
              </div>
              <div className="flex items-center gap-4 text-3xl font-bold text-white">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center">
                  ∞
                </div>
                <span>Possibilities</span>
              </div>
            </div>

            <Button className="bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white px-12 py-6 rounded-2xl font-semibold text-xl shadow-2xl hover:shadow-green-500/25 transition-all duration-300 transform hover:scale-105">
              Experience ChittyVerify
            </Button>
          </div>
        </div>
      </section>

      {/* Main Dashboard */}
      <section className="py-12 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* One-Click Authentication */}
          <div className="mb-8">
            <OneClickAuthentication />
          </div>

          {/* Progress Indicator */}
          {currentCase && typeof currentCase === 'object' && 'name' in currentCase && (
            <div className="mb-8">
              <ProgressIndicator case={currentCase as any} />
            </div>
          )}

          {/* Evidence Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Evidence Cards Column */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Evidence Registry</h2>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-1" />
                    Filter
                  </Button>
                  <Button variant="outline" size="sm">
                    <SortAsc className="w-4 h-4 mr-1" />
                    Sort
                  </Button>
                </div>
              </div>

              {/* Evidence Cards */}
              <div className="space-y-6">
                {evidenceLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="evidence-card rounded-xl p-6 animate-pulse">
                        <div className="h-24 bg-gray-200 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : evidence && Array.isArray(evidence) && evidence.length > 0 ? (
                  evidence.map((evidenceItem: any) => (
                    <EvidenceCard key={evidenceItem.id} evidence={evidenceItem} />
                  ))
                ) : (
                  <div className="evidence-card rounded-xl shadow-evidence p-12 text-center border border-gray-100">
                    <div className="text-gray-500 mb-4">
                      <i className="fas fa-folder-open text-4xl mb-4"></i>
                      <h3 className="text-xl font-semibold mb-2">No Evidence Yet</h3>
                      <p>Upload your first piece of evidence to get started with this case.</p>
                    </div>
                    <Button className="gradient-gold text-primary-navy mt-4">
                      Upload Evidence
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Adaptive Verification Flow */}
              <AdaptiveVerificationFlow 
                evidenceId="ART-CHI2025"
                currentStep={2}
                overallProgress={67}
              />
              
              {/* ChittyTrust 6D Trust Widget */}
              <SixDTrustWidget 
                user={{
                  sourceScore: 0.85,
                  timeScore: 0.78,
                  channelScore: 0.92,
                  outcomesScore: 0.88,
                  networkScore: 0.75,
                  justiceScore: 0.90,
                  composite6DTrust: 5.08,
                  fullName: "John Smith, Esq.",
                  userType: "Attorney (Petitioner)"
                }}
              />
              
              <QuickUpload />
              {currentCase && typeof currentCase === 'object' && 'name' in currentCase && <CaseOverview case={currentCase as any} />}
              <AIAnalysis />
              <ChainStatus />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
