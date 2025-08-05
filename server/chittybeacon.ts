import '@chittycorp/app-beacon';

export interface BeaconConfig {
  endpoint?: string;
  interval?: number;
  disabled?: boolean;
  verbose?: boolean;
  appName?: string;
  appVersion?: string;
}

export class ChittyBeaconService {
  private config: BeaconConfig;
  private metrics: {
    evidenceUploaded: number;
    evidenceMinted: number;
    casesCreated: number;
    usersRegistered: number;
    auditEvents: number;
    lastActivity: Date;
  };

  constructor(config?: BeaconConfig) {
    this.config = {
      endpoint: process.env.BEACON_ENDPOINT,
      interval: process.env.BEACON_INTERVAL ? parseInt(process.env.BEACON_INTERVAL) : undefined,
      disabled: process.env.BEACON_DISABLED === 'true',
      verbose: process.env.BEACON_VERBOSE === 'true',
      appName: 'chittychain-evidence-ledger',
      appVersion: '1.0.0',
      ...config
    };

    this.metrics = {
      evidenceUploaded: 0,
      evidenceMinted: 0,
      casesCreated: 0,
      usersRegistered: 0,
      auditEvents: 0,
      lastActivity: new Date()
    };

    if (this.config.verbose) {
      console.log('[ChittyBeacon] Service initialized with config:', this.config);
    }
  }

  trackEvidenceUpload() {
    this.metrics.evidenceUploaded++;
    this.metrics.lastActivity = new Date();
    this.logMetric('evidence_upload');
  }

  trackEvidenceMint() {
    this.metrics.evidenceMinted++;
    this.metrics.lastActivity = new Date();
    this.logMetric('evidence_mint');
  }

  trackCaseCreation() {
    this.metrics.casesCreated++;
    this.metrics.lastActivity = new Date();
    this.logMetric('case_created');
  }

  trackUserRegistration() {
    this.metrics.usersRegistered++;
    this.metrics.lastActivity = new Date();
    this.logMetric('user_registered');
  }

  trackAuditEvent(eventType: string) {
    this.metrics.auditEvents++;
    this.metrics.lastActivity = new Date();
    this.logMetric('audit_event', { type: eventType });
  }

  getMetrics() {
    return {
      ...this.metrics,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      platform: process.platform,
      nodeVersion: process.version
    };
  }

  private logMetric(event: string, data?: any) {
    if (this.config.verbose && !this.config.disabled) {
      console.log(`[ChittyBeacon] Event: ${event}`, data || '');
    }
  }

  async sendCustomBeacon(data: any) {
    if (this.config.disabled || !this.config.endpoint) {
      return;
    }

    try {
      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          app: this.config.appName,
          version: this.config.appVersion,
          timestamp: new Date().toISOString(),
          metrics: this.getMetrics(),
          custom: data
        })
      });

      if (this.config.verbose) {
        console.log(`[ChittyBeacon] Custom beacon sent: ${response.status}`);
      }
    } catch (error) {
      if (this.config.verbose) {
        console.error('[ChittyBeacon] Failed to send custom beacon:', error);
      }
    }
  }
}

export const chittyBeacon = new ChittyBeaconService();