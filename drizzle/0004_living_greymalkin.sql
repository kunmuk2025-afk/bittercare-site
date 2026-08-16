CREATE TABLE `funnel_events` (
	`id` text PRIMARY KEY NOT NULL,
	`case_id` text NOT NULL,
	`event_type` text NOT NULL,
	`breed` text DEFAULT 'unknown' NOT NULL,
	`pet_name` text DEFAULT '' NOT NULL,
	`dog_age` text DEFAULT '' NOT NULL,
	`chew_type` text DEFAULT '' NOT NULL,
	`chewing_target` text DEFAULT '' NOT NULL,
	`language` text DEFAULT 'ko' NOT NULL,
	`screen` text DEFAULT '' NOT NULL,
	`store` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `funnel_event_type_idx` ON `funnel_events` (`event_type`);--> statement-breakpoint
CREATE INDEX `funnel_case_idx` ON `funnel_events` (`case_id`);--> statement-breakpoint
CREATE INDEX `funnel_created_idx` ON `funnel_events` (`created_at`);