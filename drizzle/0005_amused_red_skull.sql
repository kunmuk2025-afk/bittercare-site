CREATE TABLE `observation_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`case_id` text NOT NULL,
	`day` integer NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`comparison` text DEFAULT '' NOT NULL,
	`approach_count` text DEFAULT '' NOT NULL,
	`chewed` text DEFAULT '' NOT NULL,
	`bitter_reaction` text DEFAULT '' NOT NULL,
	`adhesion` text DEFAULT '' NOT NULL,
	`help_requested` integer DEFAULT false NOT NULL,
	`photo_key` text,
	`photo_type` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `observation_session_day_unique` ON `observation_entries` (`session_id`,`day`);--> statement-breakpoint
CREATE INDEX `observation_entry_session_idx` ON `observation_entries` (`session_id`);--> statement-breakpoint
CREATE INDEX `observation_entry_case_idx` ON `observation_entries` (`case_id`);--> statement-breakpoint
CREATE TABLE `observation_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`case_id` text NOT NULL,
	`result_type` text NOT NULL,
	`summary` text NOT NULL,
	`summary_data` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `observation_report_session_unique` ON `observation_reports` (`session_id`);--> statement-breakpoint
CREATE INDEX `observation_report_case_idx` ON `observation_reports` (`case_id`);--> statement-breakpoint
CREATE INDEX `observation_report_created_idx` ON `observation_reports` (`created_at`);--> statement-breakpoint
CREATE TABLE `observation_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`case_id` text NOT NULL,
	`breed` text NOT NULL,
	`pet_name` text DEFAULT '' NOT NULL,
	`dog_age` text DEFAULT '' NOT NULL,
	`target` text DEFAULT '' NOT NULL,
	`temperament_result` text DEFAULT '' NOT NULL,
	`language` text DEFAULT 'ko' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`started_at` integer NOT NULL,
	`completed_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `observation_session_case_idx` ON `observation_sessions` (`case_id`);--> statement-breakpoint
CREATE INDEX `observation_session_status_idx` ON `observation_sessions` (`case_id`,`status`);--> statement-breakpoint
CREATE INDEX `observation_session_updated_idx` ON `observation_sessions` (`updated_at`);