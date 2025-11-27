DROP INDEX "session_token_unique";--> statement-breakpoint
DROP INDEX "settings_key_unique";--> statement-breakpoint
DROP INDEX "user_email_unique";--> statement-breakpoint
ALTER TABLE `courses` ALTER COLUMN "price" TO "price" integer NOT NULL DEFAULT 0;--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE UNIQUE INDEX `settings_key_unique` ON `settings` (`key`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
ALTER TABLE `courses` ADD `image_url` text;--> statement-breakpoint
ALTER TABLE `courses` ADD `learning_materials` text;--> statement-breakpoint
ALTER TABLE `registrations` ADD `registration_date` integer NOT NULL;