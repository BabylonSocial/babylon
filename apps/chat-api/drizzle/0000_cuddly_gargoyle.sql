CREATE TABLE "chat_admins" (
	"id" uuid PRIMARY KEY NOT NULL,
	"chat_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"granted_by" uuid NOT NULL,
	CONSTRAINT "chat_admins_chat_user_key" UNIQUE("chat_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "chat_invites" (
	"id" uuid PRIMARY KEY NOT NULL,
	"chat_id" uuid NOT NULL,
	"invited_user_id" uuid NOT NULL,
	"invited_by" uuid NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chat_invites_chat_user_key" UNIQUE("chat_id","invited_user_id")
);
--> statement-breakpoint
CREATE TABLE "chat_moderation_log" (
	"id" uuid PRIMARY KEY NOT NULL,
	"chat_id" uuid NOT NULL,
	"target_user_id" uuid NOT NULL,
	"actor_id" uuid NOT NULL,
	"action" text NOT NULL,
	"reason" text,
	"duration" integer,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_participants" (
	"id" uuid PRIMARY KEY NOT NULL,
	"chat_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"invited_by" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_message_at" timestamp with time zone DEFAULT now(),
	"message_count" integer DEFAULT 0 NOT NULL,
	"quality_score" double precision DEFAULT 1 NOT NULL,
	"kicked_at" timestamp with time zone,
	"kick_reason" text,
	"added_by" uuid,
	CONSTRAINT "chat_participants_chat_user_key" UNIQUE("chat_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "chat_users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"privy_id" text NOT NULL,
	"wallet_address" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chat_users_privy_id_unique" UNIQUE("privy_id")
);
--> statement-breakpoint
CREATE TABLE "chats" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text,
	"description" text,
	"is_group" boolean DEFAULT false NOT NULL,
	"created_by" uuid,
	"npc_admin_id" text,
	"game_id" text,
	"day_number" integer,
	"related_question" integer,
	"group_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dm_acceptances" (
	"id" uuid PRIMARY KEY NOT NULL,
	"chat_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"other_user_id" uuid NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"accepted_at" timestamp with time zone,
	"rejected_at" timestamp with time zone,
	CONSTRAINT "dm_acceptances_chat_id_unique" UNIQUE("chat_id")
);
--> statement-breakpoint
CREATE TABLE "group_chat_memberships" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"chat_id" uuid NOT NULL,
	"npc_admin_id" text NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_message_at" timestamp with time zone DEFAULT now(),
	"message_count" integer DEFAULT 0 NOT NULL,
	"quality_score" double precision DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sweep_reason" text,
	"removed_at" timestamp with time zone,
	CONSTRAINT "group_memberships_user_chat_key" UNIQUE("user_id","chat_id")
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY NOT NULL,
	"chat_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chat_admins" ADD CONSTRAINT "chat_admins_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_invites" ADD CONSTRAINT "chat_invites_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_moderation_log" ADD CONSTRAINT "chat_moderation_log_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_participants" ADD CONSTRAINT "chat_participants_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dm_acceptances" ADD CONSTRAINT "dm_acceptances_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_chat_memberships" ADD CONSTRAINT "group_chat_memberships_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chat_admins_chat_idx" ON "chat_admins" USING btree ("chat_id");--> statement-breakpoint
CREATE INDEX "chat_admins_user_idx" ON "chat_admins" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "chat_invites_chat_idx" ON "chat_invites" USING btree ("chat_id");--> statement-breakpoint
CREATE INDEX "chat_invites_user_status_idx" ON "chat_invites" USING btree ("invited_user_id","status");--> statement-breakpoint
CREATE INDEX "chat_invites_status_idx" ON "chat_invites" USING btree ("status");--> statement-breakpoint
CREATE INDEX "moderation_log_chat_idx" ON "chat_moderation_log" USING btree ("chat_id");--> statement-breakpoint
CREATE INDEX "moderation_log_target_idx" ON "chat_moderation_log" USING btree ("target_user_id");--> statement-breakpoint
CREATE INDEX "moderation_log_actor_idx" ON "chat_moderation_log" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "moderation_log_action_idx" ON "chat_moderation_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "moderation_log_created_idx" ON "chat_moderation_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "chat_participants_chat_idx" ON "chat_participants" USING btree ("chat_id");--> statement-breakpoint
CREATE INDEX "chat_participants_user_idx" ON "chat_participants" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "chat_participants_chat_active_idx" ON "chat_participants" USING btree ("chat_id","is_active");--> statement-breakpoint
CREATE INDEX "chat_participants_user_active_idx" ON "chat_participants" USING btree ("user_id","is_active");--> statement-breakpoint
CREATE INDEX "chat_users_privy_id_idx" ON "chat_users" USING btree ("privy_id");--> statement-breakpoint
CREATE INDEX "chat_users_wallet_idx" ON "chat_users" USING btree ("wallet_address");--> statement-breakpoint
CREATE INDEX "chats_game_id_day_idx" ON "chats" USING btree ("game_id","day_number");--> statement-breakpoint
CREATE INDEX "chats_group_id_idx" ON "chats" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "chats_is_group_idx" ON "chats" USING btree ("is_group");--> statement-breakpoint
CREATE INDEX "chats_created_by_idx" ON "chats" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "chats_npc_admin_id_idx" ON "chats" USING btree ("npc_admin_id");--> statement-breakpoint
CREATE INDEX "dm_acceptances_status_created_idx" ON "dm_acceptances" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "dm_acceptances_user_status_idx" ON "dm_acceptances" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "group_memberships_chat_active_idx" ON "group_chat_memberships" USING btree ("chat_id","is_active");--> statement-breakpoint
CREATE INDEX "group_memberships_user_active_idx" ON "group_chat_memberships" USING btree ("user_id","is_active");--> statement-breakpoint
CREATE INDEX "group_memberships_last_message_idx" ON "group_chat_memberships" USING btree ("last_message_at");--> statement-breakpoint
CREATE INDEX "messages_chat_created_idx" ON "messages" USING btree ("chat_id","created_at");--> statement-breakpoint
CREATE INDEX "messages_sender_idx" ON "messages" USING btree ("sender_id");