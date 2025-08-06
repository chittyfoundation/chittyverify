// ChittyID Integration Service
// Interfaces with the ChittyID API for authentication and verification

export interface ChittyIDValidation {
  chittyId: string;
  valid: boolean;
  details?: {
    timestamp: string;
    vertical: string;
    nodeId?: string;
    jurisdiction?: string;
  };
}

export interface ChittyIDGeneration {
  chittyId: string;
  displayFormat: string;
  timestamp: string;
  vertical: string;
  valid: boolean;
}

export class ChittyIDService {
  private readonly baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  async validateChittyID(chittyId: string): Promise<ChittyIDValidation> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chittyId }),
      });

      if (!response.ok) {
        throw new Error(`ChittyID API error: ${response.status}`);
      }

      return await response.json() as ChittyIDValidation;
    } catch (error) {
      console.error('ChittyID validation failed:', error);
      throw new Error(error instanceof Error ? error.message : 'Unable to validate ChittyID');
    }
  }

  async generateChittyID(vertical: string = 'user'): Promise<ChittyIDGeneration> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vertical }),
      });

      if (!response.ok) {
        throw new Error(`ChittyID API error: ${response.status}`);
      }

      return await response.json() as ChittyIDGeneration;
    } catch (error) {
      console.error('ChittyID generation failed:', error);
      throw new Error(error instanceof Error ? error.message : 'Unable to generate ChittyID');
    }
  }

  async healthCheck(): Promise<{ status: string; service: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }

      return await response.json() as { status: string; service: string };
    } catch (error) {
      console.error('ChittyID health check failed:', error);
      throw new Error(error instanceof Error ? error.message : 'ChittyID service unavailable');
    }
  }
}

export const chittyIdService = new ChittyIDService();