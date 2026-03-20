-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT,
    "name" TEXT,
    "avatar" TEXT,
    "timezone" TEXT,
    "credits" DOUBLE PRECISION DEFAULT 0,
    "ai_credits" DOUBLE PRECISION DEFAULT 0,
    "issetup" BOOLEAN NOT NULL DEFAULT false,
    "password" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assets" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "field" TEXT,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "user" TEXT,
    "max_stage_count" INTEGER,
    "status" TEXT DEFAULT 'PENDING',
    "days_interval" INTEGER,
    "setuped" BOOLEAN NOT NULL DEFAULT false,
    "email" TEXT,
    "desc" TEXT,
    "email_delivery_period" TEXT,
    "ignore_verification" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "dynamic_subject" BOOLEAN NOT NULL DEFAULT false,
    "isTrackingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "active_days" JSONB,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_email_credentials" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "email_credential_id" TEXT NOT NULL,

    CONSTRAINT "campaign_email_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_credentials" (
    "id" TEXT NOT NULL,
    "user" TEXT,
    "username" TEXT,
    "password" TEXT,
    "host" TEXT,
    "port" INTEGER,
    "secure" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT DEFAULT 'Inactive',
    "imapEmail" TEXT,
    "imapPassword" TEXT,
    "imapHost" TEXT,
    "dailyLimit" INTEGER,
    "lastCheckedTime" TIMESTAMP(3),
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns_email" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "status" TEXT DEFAULT 'PENDING',
    "personalization" JSONB,
    "sent_at" TIMESTAMP(3),
    "stage" INTEGER DEFAULT 0,
    "campaign" TEXT,
    "opened" INTEGER DEFAULT 0,
    "verified" TEXT DEFAULT 'PENDING',
    "verification_message" TEXT,
    "verification_response" TEXT,
    "cred" TEXT,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaigns_email_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_messages" (
    "id" TEXT NOT NULL,
    "text" TEXT,
    "pitch" TEXT,
    "sent" BOOLEAN NOT NULL DEFAULT false,
    "message_id" TEXT,
    "campaign_email" TEXT,
    "timestamp" TIMESTAMP(3),
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_opens" (
    "id" TEXT NOT NULL,
    "campaign_email" TEXT,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_opens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pitches_email" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "subject" TEXT,
    "campaign" TEXT,
    "stage" INTEGER,
    "message" TEXT,
    "dynamic_subject" TEXT,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pitches_email_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_transactions" (
    "id" TEXT NOT NULL,
    "user" TEXT,
    "amount" DOUBLE PRECISION,
    "timestamp" TIMESTAMP(3),
    "type" TEXT,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credit_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_activities" (
    "id" TEXT NOT NULL,
    "deal" TEXT,
    "campaign" TEXT,
    "type" TEXT,
    "description" TEXT,
    "from_stage" TEXT,
    "to_stage" TEXT,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_deals" (
    "id" TEXT NOT NULL,
    "lead" TEXT,
    "campaign" TEXT,
    "stage" TEXT,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_deals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_stages" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "campaign" TEXT,
    "order" INTEGER,
    "color" TEXT,
    "is_won" BOOLEAN NOT NULL DEFAULT false,
    "is_lost" BOOLEAN NOT NULL DEFAULT false,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_analysis_campaigns" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3),
    "opened" INTEGER DEFAULT 0,
    "emails_sent" INTEGER DEFAULT 0,
    "campaign" TEXT,
    "percentage_completed" DOUBLE PRECISION DEFAULT 0,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_analysis_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_emails" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "user" TEXT,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_emails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_list_items" (
    "id" TEXT NOT NULL,
    "lead_list" TEXT,
    "name" TEXT,
    "email" TEXT,
    "website" TEXT,
    "company" TEXT,
    "personalization" JSONB,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_list_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_lists" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "user" TEXT,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "user" TEXT,
    "website" TEXT,
    "data" JSONB,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resource_assets" (
    "id" TEXT NOT NULL,
    "field" TEXT,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resource_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resources" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "category" TEXT,
    "subcategory" TEXT,
    "type" TEXT,
    "description" TEXT,
    "link" TEXT,
    "live" BOOLEAN NOT NULL DEFAULT false,
    "thumbnail" TEXT,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scrape_jobs" (
    "id" TEXT NOT NULL,
    "query" TEXT,
    "location" TEXT,
    "status" TEXT,
    "message" TEXT,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scrape_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scrape_results" (
    "id" TEXT NOT NULL,
    "job_id" TEXT,
    "name" TEXT,
    "address" TEXT,
    "query" TEXT,
    "location" TEXT,
    "scraped_at" TIMESTAMP(3),
    "website" TEXT,
    "website_url" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "plus_code" TEXT,
    "check_in_time" TEXT,
    "check_out_time" TEXT,
    "rating" TEXT,
    "latitude" TEXT,
    "longitude" TEXT,
    "osint" JSONB,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scrape_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_campaign_pitches" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "subject" TEXT,
    "campaign_template" TEXT,
    "stage" INTEGER,
    "message" TEXT,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "template_campaign_pitches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_campaigns" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "max_stage_count" INTEGER,
    "days_interval" INTEGER,
    "description" TEXT,
    "email_delivery_period" TEXT,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "template_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "waitlist" (
    "id" TEXT NOT NULL,
    "username" TEXT,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "timezone" TEXT,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "waitlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "website_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "session_id" TEXT,
    "start_time" TIMESTAMP(3),
    "last_activity" TIMESTAMP(3),
    "session_data" JSONB,
    "referrer" TEXT,
    "device_info" JSONB,
    "total_time_spent" DOUBLE PRECISION DEFAULT 0,
    "page_views" INTEGER DEFAULT 0,
    "interactions" INTEGER DEFAULT 0,
    "engagement_score" DOUBLE PRECISION DEFAULT 0,
    "campaign_source" TEXT,
    "conversion_completed" BOOLEAN NOT NULL DEFAULT false,
    "conversion_type" TEXT,
    "conversion_value" DOUBLE PRECISION DEFAULT 0,
    "tags" JSONB,
    "notes" TEXT,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "website_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_email_credentials_campaign_id_email_credential_id_key" ON "campaign_email_credentials"("campaign_id", "email_credential_id");

-- CreateIndex
CREATE INDEX "campaigns_email_email_idx" ON "campaigns_email"("email");

-- CreateIndex
CREATE INDEX "waitlist_email_idx" ON "waitlist"("email");

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_user_fkey" FOREIGN KEY ("user") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_email_fkey" FOREIGN KEY ("email") REFERENCES "email_credentials"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_email_credentials" ADD CONSTRAINT "campaign_email_credentials_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_email_credentials" ADD CONSTRAINT "campaign_email_credentials_email_credential_id_fkey" FOREIGN KEY ("email_credential_id") REFERENCES "email_credentials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_credentials" ADD CONSTRAINT "email_credentials_user_fkey" FOREIGN KEY ("user") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns_email" ADD CONSTRAINT "campaigns_email_campaign_fkey" FOREIGN KEY ("campaign") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns_email" ADD CONSTRAINT "campaigns_email_cred_fkey" FOREIGN KEY ("cred") REFERENCES "email_credentials"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_messages" ADD CONSTRAINT "campaign_messages_pitch_fkey" FOREIGN KEY ("pitch") REFERENCES "pitches_email"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_messages" ADD CONSTRAINT "campaign_messages_campaign_email_fkey" FOREIGN KEY ("campaign_email") REFERENCES "campaigns_email"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_opens" ADD CONSTRAINT "campaign_opens_campaign_email_fkey" FOREIGN KEY ("campaign_email") REFERENCES "campaigns_email"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pitches_email" ADD CONSTRAINT "pitches_email_campaign_fkey" FOREIGN KEY ("campaign") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_user_fkey" FOREIGN KEY ("user") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_deal_fkey" FOREIGN KEY ("deal") REFERENCES "crm_deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_campaign_fkey" FOREIGN KEY ("campaign") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_from_stage_fkey" FOREIGN KEY ("from_stage") REFERENCES "crm_stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_to_stage_fkey" FOREIGN KEY ("to_stage") REFERENCES "crm_stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_deals" ADD CONSTRAINT "crm_deals_lead_fkey" FOREIGN KEY ("lead") REFERENCES "campaigns_email"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_deals" ADD CONSTRAINT "crm_deals_campaign_fkey" FOREIGN KEY ("campaign") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_deals" ADD CONSTRAINT "crm_deals_stage_fkey" FOREIGN KEY ("stage") REFERENCES "crm_stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_stages" ADD CONSTRAINT "crm_stages_campaign_fkey" FOREIGN KEY ("campaign") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_analysis_campaigns" ADD CONSTRAINT "daily_analysis_campaigns_campaign_fkey" FOREIGN KEY ("campaign") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_emails" ADD CONSTRAINT "daily_emails_user_fkey" FOREIGN KEY ("user") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_list_items" ADD CONSTRAINT "lead_list_items_lead_list_fkey" FOREIGN KEY ("lead_list") REFERENCES "lead_lists"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_lists" ADD CONSTRAINT "lead_lists_user_fkey" FOREIGN KEY ("user") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_user_fkey" FOREIGN KEY ("user") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scrape_results" ADD CONSTRAINT "scrape_results_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "scrape_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_campaign_pitches" ADD CONSTRAINT "template_campaign_pitches_campaign_template_fkey" FOREIGN KEY ("campaign_template") REFERENCES "template_campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "website_sessions" ADD CONSTRAINT "website_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "campaigns_email"("id") ON DELETE SET NULL ON UPDATE CASCADE;
