/*
  Warnings:

  - You are about to drop the column `email` on the `campaigns` table. All the data in the column will be lost.
  - You are about to drop the `daily_analysis_campaigns` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `daily_emails` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `resource_assets` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `resources` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `scrape_jobs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `scrape_results` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `website_sessions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "campaigns" DROP CONSTRAINT "campaigns_email_fkey";

-- DropForeignKey
ALTER TABLE "daily_analysis_campaigns" DROP CONSTRAINT "daily_analysis_campaigns_campaign_fkey";

-- DropForeignKey
ALTER TABLE "daily_emails" DROP CONSTRAINT "daily_emails_user_fkey";

-- DropForeignKey
ALTER TABLE "scrape_results" DROP CONSTRAINT "scrape_results_job_id_fkey";

-- DropForeignKey
ALTER TABLE "website_sessions" DROP CONSTRAINT "website_sessions_user_id_fkey";

-- AlterTable
ALTER TABLE "campaigns" DROP COLUMN "email";

-- DropTable
DROP TABLE "daily_analysis_campaigns";

-- DropTable
DROP TABLE "daily_emails";

-- DropTable
DROP TABLE "resource_assets";

-- DropTable
DROP TABLE "resources";

-- DropTable
DROP TABLE "scrape_jobs";

-- DropTable
DROP TABLE "scrape_results";

-- DropTable
DROP TABLE "website_sessions";

-- CreateTable
CREATE TABLE "agent_chat_messages" (
    "id" TEXT NOT NULL,
    "thread_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tool_name" TEXT,
    "user_id" TEXT NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "agent_chat_messages_user_id_thread_id_idx" ON "agent_chat_messages"("user_id", "thread_id");

-- AddForeignKey
ALTER TABLE "agent_chat_messages" ADD CONSTRAINT "agent_chat_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
