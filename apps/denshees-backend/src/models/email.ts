/**
 * Email-related interfaces for the email processor
 */

export interface EmailRecord {
  id: string;
  email: string;
  name?: string;
  stage: number;
  status: string;
  personalization: any;
  credId?: string | null;
  sentAt?: Date | null;
  campaignId?: string | null;
  opened?: number;
  verified?: string;
  campaign?: CampaignRecord;
}

export interface PitchRecord {
  id: string;
  subject: string;
  message: string;
}

export interface CampaignEmailCredential {
  id: string;
  campaignId: string;
  emailCredentialId: string;
  emailCredential: CredentialRecord;
}

export interface CampaignRecord {
  id: string;
  maxStageCount: number;
  activeDays?: any;
  daysInterval?: number;
  emailDeliveryPeriod?: string;
  userId?: string;
  user?: UserRecord;
  isTrackingEnabled?: boolean;
  campaignEmailCredentials?: CampaignEmailCredential[];
}

export interface UserRecord {
  id: string;
  email: string;
  credits: number;
  timezone?: string;
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
