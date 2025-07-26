import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Navigation } from "@/components/ui/navigation";
import { Footer } from "@/components/ui/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrustIndicator } from "@/components/ui/trust-indicator";
import { ArrowLeft, Download, Share2, Zap, Link as LinkIcon, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function EvidenceDetails() {
  const [match, params] = useRoute("/evidence/:id");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: evidence, isLoading } = useQuery({
    queryKey: ["/api/evidence", params?.id],
    enabled: !!params?.id,
  });

  const analyzeMutation = useMutation({
    mutationFn: (evidenceId: string) => 
      apiRequest("POST", `/api/evidence/${evidenceId}/analyze`),
    onSuccess: () => {
      toast({
        title: "Analysis Complete",
        description: "AI analysis has been completed for this evidence.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/evidence", params?.id] });
    },
    onError: () => {
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze evidence. Please try again.",
        variant: "destructive",
      });
    },
  });

  const mintMutation = useMutation({
    mutationFn: (evidenceId: string) => 
      apiRequest("POST", `/api/evidence/${evidenceId}/mint`),
    onSuccess: () => {
      toast({
        title: "Evidence Minted",
        description: "Evidence has been successfully minted to the blockchain.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/evidence", params?.id] });
    },
    onError: () => {
      toast({
        title: "Minting Failed",
        description: "Failed to mint evidence to blockchain. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (!match) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 bg-noise">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-6"></div>
            <div className="space-y-4">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-24 bg-gray-200 rounded"></div>
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!evidence) {
    return (
      <div className="min-h-screen bg-gray-50 bg-noise">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Card className="text-center">
            <CardContent className="pt-6">
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Evidence Not Found</h2>
              <p className="text-gray-600">The requested evidence could not be found.</p>
              <Link href="/">
                <Button className="mt-4">Return to Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified": return <CheckCircle className="w-5 h-5 text-status-verified" />;
      case "pending": return <Clock className="w-5 h-5 text-status-pending" />;
      case "minted": return <LinkIcon className="w-5 h-5 text-status-minted" />;
      default: return <AlertTriangle className="w-5 h-5 text-status-failed" />;
    }
  };

  const getEvidenceTypeColor = (type: string) => {
    switch (type) {
      case "document": return "bg-evidence-document";
      case "property_tax": return "bg-evidence-financial";
      case "communication": return "bg-evidence-communication";
      case "financial": return "bg-evidence-financial";
      case "legal": return "bg-evidence-legal";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 bg-noise">
      <Navigation />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <div className={`w-16 h-16 ${getEvidenceTypeColor(evidence.type)} rounded-xl flex items-center justify-center`}>
                <i className={`fas ${evidence.type === 'property_tax' ? 'fa-home' : evidence.type === 'communication' ? 'fa-envelope' : evidence.type === 'financial' ? 'fa-chart-line' : 'fa-file-alt'} text-white text-2xl`}></i>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{evidence.title}</h1>
                <p className="text-gray-600 mb-4">{evidence.description}</p>
                <div className="flex items-center space-x-4">
                  <Badge variant="outline" className="text-sm">
                    {evidence.artifactId}
                  </Badge>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(evidence.status)}
                    <span className="capitalize font-medium">{evidence.status}</span>
                  </div>
                  <TrustIndicator score={evidence.trustScore} size="lg" />
                </div>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              {evidence.status === "verified" && !evidence.blockchain && (
                <Button 
                  onClick={() => mintMutation.mutate(evidence.id)}
                  disabled={mintMutation.isPending}
                  className="gradient-primary text-white"
                >
                  <LinkIcon className="w-4 h-4 mr-2" />
                  {mintMutation.isPending ? "Minting..." : "Mint to Chain"}
                </Button>
              )}
              <Button 
                onClick={() => analyzeMutation.mutate(evidence.id)}
                disabled={analyzeMutation.isPending}
                className="gradient-gold text-primary-navy"
              >
                <Zap className="w-4 h-4 mr-2" />
                {analyzeMutation.isPending ? "Analyzing..." : "Run AI Analysis"}
              </Button>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* File Information */}
            <Card className="evidence-card">
              <CardHeader>
                <CardTitle>File Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 uppercase tracking-wide">Type</p>
                    <p className="font-medium capitalize">{evidence.type.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 uppercase tracking-wide">Subtype</p>
                    <p className="font-medium capitalize">{evidence.subtype?.replace('_', ' ') || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 uppercase tracking-wide">File Size</p>
                    <p className="font-medium">{evidence.fileSize ? `${(evidence.fileSize / 1024).toFixed(1)} KB` : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 uppercase tracking-wide">MIME Type</p>
                    <p className="font-medium">{evidence.mimeType || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 uppercase tracking-wide">Uploaded</p>
                    <p className="font-medium">{new Date(evidence.uploadedAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 uppercase tracking-wide">Verified</p>
                    <p className="font-medium">{evidence.verifiedAt ? new Date(evidence.verifiedAt).toLocaleDateString() : 'Not verified'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Extracted Facts */}
            {evidence.facts && (
              <Card className="evidence-card">
                <CardHeader>
                  <CardTitle>Extracted Facts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(evidence.facts).map(([key, value]) => (
                        <div key={key} className="border-b border-blue-200 pb-2 last:border-b-0">
                          <p className="text-sm text-blue-600 capitalize font-medium">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </p>
                          <p className="text-blue-900 font-semibold">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* AI Analysis Results */}
            {evidence.analysis && (
              <Card className="evidence-card">
                <CardHeader>
                  <CardTitle>AI Analysis Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {evidence.analysis.confidence && (
                      <div>
                        <p className="text-sm text-gray-600 uppercase tracking-wide mb-2">Confidence Score</p>
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-3">
                            <div 
                              className="bg-blue-600 h-3 rounded-full" 
                              style={{ width: `${evidence.analysis.confidence * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{Math.round(evidence.analysis.confidence * 100)}%</span>
                        </div>
                      </div>
                    )}

                    {evidence.analysis.keyFindings && (
                      <div>
                        <p className="text-sm text-gray-600 uppercase tracking-wide mb-2">Key Findings</p>
                        <ul className="space-y-1">
                          {evidence.analysis.keyFindings.map((finding: string, index: number) => (
                            <li key={index} className="text-sm text-gray-800 flex items-start">
                              <span className="text-green-500 mr-2">•</span>
                              {finding}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Blockchain Status */}
            {evidence.blockchain && (
              <Card className="evidence-card">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <LinkIcon className="w-5 h-5 mr-2 text-primary-blue" />
                    Blockchain Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Status</span>
                      <Badge className="bg-status-minted text-white capitalize">
                        {evidence.blockchain.status}
                      </Badge>
                    </div>
                    {evidence.blockchain.hash && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Hash</span>
                        <span className="font-mono text-sm text-gray-800 truncate max-w-32">
                          {evidence.blockchain.hash}
                        </span>
                      </div>
                    )}
                    {evidence.blockchain.blockNumber && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Block</span>
                        <span className="font-mono text-sm">#{evidence.blockchain.blockNumber}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Metadata */}
            {evidence.metadata && (
              <Card className="evidence-card">
                <CardHeader>
                  <CardTitle>Metadata</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(evidence.metadata).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </span>
                        <span className="font-medium text-right">
                          {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Related Actions */}
            <Card className="evidence-card">
              <CardHeader>
                <CardTitle>Related Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <i className="fas fa-search mr-2"></i>
                  Find Similar Evidence
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <i className="fas fa-code-branch mr-2"></i>
                  View Evidence Chain
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <i className="fas fa-history mr-2"></i>
                  View Audit Trail
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <i className="fas fa-flag mr-2"></i>
                  Report Issue
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
