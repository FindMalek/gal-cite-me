ALTER TABLE "Chunk" ADD COLUMN "sourceDocId" text;--> statement-breakpoint
ALTER TABLE "Chunk" ADD COLUMN "chunkIndex" integer;--> statement-breakpoint
ALTER TABLE "Chunk" ADD COLUMN "sectionHeading" text;--> statement-breakpoint
ALTER TABLE "Chunk" ADD COLUMN "publishYear" integer;--> statement-breakpoint
ALTER TABLE "Chunk" ADD COLUMN "usageCount" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "Chunk" DROP COLUMN IF EXISTS "source_doc_id";--> statement-breakpoint
ALTER TABLE "Chunk" DROP COLUMN IF EXISTS "chunk_index";--> statement-breakpoint
ALTER TABLE "Chunk" DROP COLUMN IF EXISTS "section_heading";--> statement-breakpoint
ALTER TABLE "Chunk" DROP COLUMN IF EXISTS "publish_year";--> statement-breakpoint
ALTER TABLE "Chunk" DROP COLUMN IF EXISTS "usage_count";--> statement-breakpoint
ALTER TABLE "Chunk" DROP COLUMN IF EXISTS "created_at";