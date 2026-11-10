ALTER TABLE "plants" ADD COLUMN "name_zh" text;--> statement-breakpoint
ALTER TABLE "plants" ADD COLUMN "soil_type_zh" text;--> statement-breakpoint
ALTER TABLE "plants" ADD COLUMN "sunlight_zh" text;--> statement-breakpoint
ALTER TABLE "plants" ADD COLUMN "watering_zh" text;--> statement-breakpoint
ALTER TABLE "plants" ADD COLUMN "spacing_zh" text;--> statement-breakpoint
ALTER TABLE "plants" ADD COLUMN "companion_plants_zh" text[];--> statement-breakpoint
ALTER TABLE "plants" ADD COLUMN "image_credits" jsonb DEFAULT '{}'::jsonb NOT NULL;