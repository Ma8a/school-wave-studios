ALTER TABLE `lessons` ADD `week` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `current_week` integer DEFAULT 1 NOT NULL;