CREATE TABLE "marketplace_listings" (
	"cloud" text NOT NULL,
	"app_key" text NOT NULL,
	"listing_id" text,
	"listing_name" text,
	"seller" text,
	"counts" boolean DEFAULT false NOT NULL,
	"checked_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "marketplace_listings_cloud_app_key_pk" PRIMARY KEY("cloud","app_key")
);
--> statement-breakpoint
ALTER TABLE "marketplace_listings" ENABLE ROW LEVEL SECURITY;