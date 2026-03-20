/**
 * Email-related interfaces for the email processor
 */

export interface EmailRecord {
  id: string;
  email: string;
  name?: string;
  stage: number;
  status: string;
  personalization: string;
  cred?: string;
  sentAt?: string;
  error?: string;
  campaign?: CampaignRecord;
  campaignCredentials?: CredentialRecord[];
}

export interface PitchRecord {
  id: string;
  subject: string;
  message: string;
}

export interface CampaignRecord {
  id: string;
  maxStageCount: number;
  activeDays?: string[];
  user?: UserRecord;
  isTrackingEnabled?: boolean;
}

export interface UserRecord {
  id: string;
  email: string;
  credits: number;
}

export interface CredentialRecord {
  id: string;
  host: string;
  port?: number;
  secure: boolean;
  username: string;
  password: string;
  dailyLimit?: number;
  userId?: string;
}

export interface MailOptions {
  from: string;
  to: string;
  subject: string;
  html: string;
  messageId?: string;
  headers?: Record<string, string>;
}

export interface CampaignMessageRecord {
  sent: boolean;
  text: string;
  pitchId: string;
  messageId: string;
  campaignEmailId: string;
}
