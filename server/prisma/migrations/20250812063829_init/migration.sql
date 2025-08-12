/*
  Warnings:

  - The primary key for the `Progress` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `hours_studied` on the `Progress` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `Progress` table. All the data in the column will be lost.
  - You are about to drop the column `last_active` on the `Progress` table. All the data in the column will be lost.
  - You are about to drop the column `topics_completed` on the `Progress` table. All the data in the column will be lost.
  - The primary key for the `Settings` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Settings` table. All the data in the column will be lost.
  - You are about to drop the column `language` on the `Settings` table. All the data in the column will be lost.
  - You are about to drop the column `notifications` on the `Settings` table. All the data in the column will be lost.
  - You are about to drop the column `theme` on the `Settings` table. All the data in the column will be lost.
  - You are about to drop the `AIRecommendation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Achievement` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Answer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Notification` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StudyGoal` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - Changed the type of `user_id` on the `Progress` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `user_id` on the `Settings` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "public"."DifficultyLevel" AS ENUM ('easy', 'medium', 'hard');

-- CreateEnum
CREATE TYPE "public"."PlanStatus" AS ENUM ('pending', 'in_progress', 'done');

-- CreateEnum
CREATE TYPE "public"."TaskType" AS ENUM ('reading', 'video', 'quiz', 'custom');

-- CreateEnum
CREATE TYPE "public"."TaskStatus" AS ENUM ('incomplete', 'complete', 'skipped');

-- CreateEnum
CREATE TYPE "public"."RecommendationType" AS ENUM ('revise', 'advance', 'slow_down', 'repeat_easy');

-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('reminder', 'alert', 'achievement');

-- DropForeignKey
ALTER TABLE "public"."AIRecommendation" DROP CONSTRAINT "AIRecommendation_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Achievement" DROP CONSTRAINT "Achievement_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Answer" DROP CONSTRAINT "Answer_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Notification" DROP CONSTRAINT "Notification_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Progress" DROP CONSTRAINT "Progress_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Settings" DROP CONSTRAINT "Settings_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."StudyGoal" DROP CONSTRAINT "StudyGoal_user_id_fkey";

-- AlterTable
ALTER TABLE "public"."Progress" DROP CONSTRAINT "Progress_pkey",
DROP COLUMN "hours_studied",
DROP COLUMN "id",
DROP COLUMN "last_active",
DROP COLUMN "topics_completed",
ADD COLUMN     "last_active_date" TIMESTAMP(3),
ADD COLUMN     "progress_id" UUID NOT NULL DEFAULT gen_random_uuid(),
ADD COLUMN     "total_tasks_completed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "total_tasks_skipped" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "total_time_spent" INTEGER NOT NULL DEFAULT 0,
DROP COLUMN "user_id",
ADD COLUMN     "user_id" UUID NOT NULL,
ADD CONSTRAINT "Progress_pkey" PRIMARY KEY ("progress_id");

-- AlterTable
ALTER TABLE "public"."Settings" DROP CONSTRAINT "Settings_pkey",
DROP COLUMN "id",
DROP COLUMN "language",
DROP COLUMN "notifications",
DROP COLUMN "theme",
ADD COLUMN     "daily_study_hours" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "email_reminder" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "interface_theme" TEXT NOT NULL DEFAULT 'light',
ADD COLUMN     "preferred_time_blocks" JSONB,
ADD COLUMN     "setting_id" UUID NOT NULL DEFAULT gen_random_uuid(),
ADD COLUMN     "weekend_days" TEXT[],
DROP COLUMN "user_id",
ADD COLUMN     "user_id" UUID NOT NULL,
ADD CONSTRAINT "Settings_pkey" PRIMARY KEY ("setting_id");

-- DropTable
DROP TABLE "public"."AIRecommendation";

-- DropTable
DROP TABLE "public"."Achievement";

-- DropTable
DROP TABLE "public"."Answer";

-- DropTable
DROP TABLE "public"."Notification";

-- DropTable
DROP TABLE "public"."StudyGoal";

-- DropTable
DROP TABLE "public"."User";

-- CreateTable
CREATE TABLE "public"."Users" (
    "user_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "profile_picture" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "public"."StudyGoals" (
    "goal_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "difficulty_level" "public"."DifficultyLevel" NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudyGoals_pkey" PRIMARY KEY ("goal_id")
);

-- CreateTable
CREATE TABLE "public"."DailyPlans" (
    "plan_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "goal_id" UUID NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "public"."PlanStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyPlans_pkey" PRIMARY KEY ("plan_id")
);

-- CreateTable
CREATE TABLE "public"."Tasks" (
    "task_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "plan_id" UUID NOT NULL,
    "type" "public"."TaskType",
    "title" TEXT NOT NULL,
    "description" TEXT,
    "resource_url" TEXT,
    "estimated_duration" INTEGER,
    "status" "public"."TaskStatus" NOT NULL DEFAULT 'incomplete',
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "Tasks_pkey" PRIMARY KEY ("task_id")
);

-- CreateTable
CREATE TABLE "public"."Quizzes" (
    "quiz_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "task_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "total_score" INTEGER,

    CONSTRAINT "Quizzes_pkey" PRIMARY KEY ("quiz_id")
);

-- CreateTable
CREATE TABLE "public"."Questions" (
    "question_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "quiz_id" UUID NOT NULL,
    "question_text" TEXT NOT NULL,
    "option_a" TEXT NOT NULL,
    "option_b" TEXT NOT NULL,
    "option_c" TEXT,
    "option_d" TEXT,
    "correct_option" CHAR(1) NOT NULL,

    CONSTRAINT "Questions_pkey" PRIMARY KEY ("question_id")
);

-- CreateTable
CREATE TABLE "public"."Answers" (
    "answer_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "question_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "selected_option" CHAR(1),
    "is_correct" BOOLEAN,
    "answered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Answers_pkey" PRIMARY KEY ("answer_id")
);

-- CreateTable
CREATE TABLE "public"."AIRecommendations" (
    "recommendation_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "task_id" UUID,
    "recommendation_text" TEXT NOT NULL,
    "recommendation_type" "public"."RecommendationType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIRecommendations_pkey" PRIMARY KEY ("recommendation_id")
);

-- CreateTable
CREATE TABLE "public"."Achievements" (
    "achievement_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "achieved_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Achievements_pkey" PRIMARY KEY ("achievement_id")
);

-- CreateTable
CREATE TABLE "public"."Notifications" (
    "notification_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "task_id" UUID,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "notification_type" "public"."NotificationType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scheduled_for" TIMESTAMP(3),

    CONSTRAINT "Notifications_pkey" PRIMARY KEY ("notification_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Users_email_key" ON "public"."Users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Progress_user_id_key" ON "public"."Progress"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Settings_user_id_key" ON "public"."Settings"("user_id");

-- AddForeignKey
ALTER TABLE "public"."StudyGoals" ADD CONSTRAINT "StudyGoals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."Users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DailyPlans" ADD CONSTRAINT "DailyPlans_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "public"."StudyGoals"("goal_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Tasks" ADD CONSTRAINT "Tasks_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."DailyPlans"("plan_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Quizzes" ADD CONSTRAINT "Quizzes_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."Tasks"("task_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Questions" ADD CONSTRAINT "Questions_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "public"."Quizzes"("quiz_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Answers" ADD CONSTRAINT "Answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."Questions"("question_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Answers" ADD CONSTRAINT "Answers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."Users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Progress" ADD CONSTRAINT "Progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."Users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AIRecommendations" ADD CONSTRAINT "AIRecommendations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."Users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AIRecommendations" ADD CONSTRAINT "AIRecommendations_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."Tasks"("task_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Achievements" ADD CONSTRAINT "Achievements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."Users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Settings" ADD CONSTRAINT "Settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."Users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notifications" ADD CONSTRAINT "Notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."Users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notifications" ADD CONSTRAINT "Notifications_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."Tasks"("task_id") ON DELETE SET NULL ON UPDATE CASCADE;
