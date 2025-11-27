DROP INDEX "session_token_unique";--> statement-breakpoint
DROP INDEX "settings_key_unique";--> statement-breakpoint
DROP INDEX "user_email_unique";--> statement-breakpoint
ALTER TABLE `user` ALTER COLUMN "phone" TO "phone" text;--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE UNIQUE INDEX `settings_key_unique` ON `settings` (`key`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
ALTER TABLE `user` ALTER COLUMN "work_email" TO "work_email" text;--> statement-breakpoint
ALTER TABLE `user` ALTER COLUMN "personal_email" TO "personal_email" text;--> statement-breakpoint
ALTER TABLE `user` ALTER COLUMN "full_name" TO "full_name" text;--> statement-breakpoint
ALTER TABLE `user` ALTER COLUMN "age" TO "age" integer;--> statement-breakpoint
ALTER TABLE `user` ALTER COLUMN "organization" TO "organization" text;--> statement-breakpoint
ALTER TABLE `user` ALTER COLUMN "position" TO "position" text;--> statement-breakpoint
ALTER TABLE `user` ALTER COLUMN "experience" TO "experience" text;