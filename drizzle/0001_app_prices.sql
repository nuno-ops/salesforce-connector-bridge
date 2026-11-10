CREATE TABLE "app_prices" (
	"connection_id" uuid PRIMARY KEY NOT NULL,
	"prices" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app_prices" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "app_prices" ADD CONSTRAINT "app_prices_connection_id_sf_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."sf_connections"("id") ON DELETE cascade ON UPDATE no action;