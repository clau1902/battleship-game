CREATE TABLE IF NOT EXISTS "games" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"player1_id" text NOT NULL,
	"player2_id" text,
	"current_turn" varchar(10) DEFAULT 'player1' NOT NULL,
	"status" varchar(20) DEFAULT 'waiting' NOT NULL,
	"player1_board" jsonb NOT NULL,
	"player2_board" jsonb NOT NULL,
	"player1_ships" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"player2_ships" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"player1_ready" boolean DEFAULT false NOT NULL,
	"player2_ready" boolean DEFAULT false NOT NULL,
	"winner" varchar(10),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
