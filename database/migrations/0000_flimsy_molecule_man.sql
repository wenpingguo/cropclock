CREATE TYPE "public"."frost_tolerance" AS ENUM('none', 'light', 'hardy');--> statement-breakpoint
CREATE TABLE "plants" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"image_adult" text,
	"image_seed" text,
	"image_baby" text,
	"sowing_months" integer[] NOT NULL,
	"harvest_weeks_min" integer NOT NULL,
	"harvest_weeks_max" integer NOT NULL,
	"soil_type" text NOT NULL,
	"ph_min" numeric(3, 1) NOT NULL,
	"ph_max" numeric(3, 1) NOT NULL,
	"sunlight" text NOT NULL,
	"watering" text NOT NULL,
	"spacing" text NOT NULL,
	"companion_plants" text[] DEFAULT '{}' NOT NULL,
	"frost_tolerance" "frost_tolerance" NOT NULL,
	"popularity" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "plants_slug_unique" UNIQUE("slug"),
	CONSTRAINT "plants_sowing_months_valid" CHECK (cardinality("plants"."sowing_months") > 0 AND "plants"."sowing_months" <@ ARRAY[1,2,3,4,5,6,7,8,9,10,11,12]),
	CONSTRAINT "plants_harvest_weeks_valid" CHECK ("plants"."harvest_weeks_min" > 0 AND "plants"."harvest_weeks_min" <= "plants"."harvest_weeks_max"),
	CONSTRAINT "plants_ph_valid" CHECK ("plants"."ph_min" >= 0 AND "plants"."ph_max" <= 14 AND "plants"."ph_min" <= "plants"."ph_max")
);
--> statement-breakpoint
CREATE INDEX "plants_sowing_months_idx" ON "plants" USING gin ("sowing_months");--> statement-breakpoint
CREATE INDEX "plants_popularity_idx" ON "plants" USING btree ("popularity" DESC NULLS LAST);