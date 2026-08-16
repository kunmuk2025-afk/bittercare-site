CREATE TABLE `assessment_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`case_id` text NOT NULL,
	`assessment_type` text NOT NULL,
	`breed` text NOT NULL,
	`pet_name` text DEFAULT '' NOT NULL,
	`language` text DEFAULT 'ko' NOT NULL,
	`answers` text NOT NULL,
	`result` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `assessment_case_type_unique` ON `assessment_entries` (`case_id`,`assessment_type`);--> statement-breakpoint
CREATE INDEX `assessment_case_idx` ON `assessment_entries` (`case_id`);--> statement-breakpoint
CREATE INDEX `assessment_updated_idx` ON `assessment_entries` (`updated_at`);