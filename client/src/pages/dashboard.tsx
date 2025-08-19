import { useQuery } from "@tanstack/react-query";
import { Navigation } from "@/components/ui/navigation";
import { Footer } from "@/components/ui/footer";
import { OneClickAuthentication } from "@/components/authentication/OneClickAuthentication";
import { EvidenceCard } from "@/components/ui/evidence-card";
import ChittyBeaconWidget from "@/components/beacon/ChittyBeaconWidget";
import { QuickShareButton } from "@/components/sharing/QuickShareButton";
import { Shield, FileCheck, Zap } from "lucide-react";
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-primary-blue border-t-transparent rounded-full animate-spin"></div>
          <div className="text-lg text-muted-foreground">Loading ChittyVerify...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="hero-section py-16 fade-in">
        <div className="container-professional">
          <div className="text-center relative z-10">
            <div className="inline-flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-5xl font-bold">
                  <span className="text-white">Chitty</span>
                  <span className="text-gradient-primary">Verify</span>
                </h1>
              </div>
            </div>
            
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              Create immutable, court-ready evidence records with cryptographic proof
            </p>
            
            <div className="flex justify-center">
              <OneClickAuthentication />
            </div>
          </div>
        </div>
      </section>

      {/* ChittyBeacon Integration */}
      <section className="py-12">
        <div className="container-professional">
          <ChittyBeaconWidget />
        </div>
      </section>

      {/* Evidence Dashboard */}
      <section className="py-12">
        <div className="container-professional">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-white">Your Evidence</h2>
            <button className="btn-primary flex items-center gap-2">
              <Zap className="w-5 h-5" />
              New Evidence
            </button>
          </div>

          {evidenceLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="professional-card p-8 animate-pulse">
                  <div className="w-full h-32 bg-muted rounded-lg mb-4"></div>
                  <div className="w-3/4 h-4 bg-muted rounded mb-2"></div>
                  <div className="w-1/2 h-3 bg-muted rounded"></div>
                </div>
              ))}
            </div>
          ) : evidence && Array.isArray(evidence) && evidence.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {evidence.map((item: any, index: number) => (
                <EvidenceCard 
                  key={item.id} 
                  evidence={item}
                />
              ))}
            </div>
          ) : (
            <div className="professional-card p-12 text-center">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-card flex items-center justify-center">
                  <FileCheck className="w-8 h-8 text-primary-blue" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">No Evidence Yet</h3>
              <p className="text-lg text-slate-400 mb-8">
                Upload your first piece of evidence to start building your verified legal record.
              </p>
              <button className="btn-primary">
                Upload First Evidence
              </button>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}