CREATE TABLE `user_data` (
	`uid` text PRIMARY KEY NOT NULL,
	`black_tags` text DEFAULT '{}' NOT NULL,
	`video_cates_list` text DEFAULT '[]' NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`uid`) REFERENCES `users`(`uid`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`uid` text PRIMARY KEY NOT NULL,
	`nickname` text NOT NULL,
	`first_login_at` integer NOT NULL,
	`last_opened_at` integer NOT NULL,
	`app_version` text
);
--> statement-breakpoint
CREATE INDEX `users_last_opened_idx` ON `users` ("last_opened_at" DESC,`uid`);