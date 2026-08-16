CREATE TABLE `diary_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`case_id` text NOT NULL,
	`day` integer NOT NULL,
	`breed` text NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`photo_key` text,
	`photo_type` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `diary_case_day_unique` ON `diary_entries` (`case_id`,`day`);--> statement-breakpoint
CREATE INDEX `diary_case_idx` ON `diary_entries` (`case_id`);