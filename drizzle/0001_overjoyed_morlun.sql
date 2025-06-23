ALTER TABLE "Chunk" ADD COLUMN "source_doc_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "Chunk" ADD COLUMN "chunk_index" real NOT NULL;--> statement-breakpoint
ALTER TABLE "Chunk" ADD COLUMN "section_heading" text;--> statement-breakpoint
ALTER TABLE "Chunk" ADD COLUMN "doi" text;--> statement-breakpoint
ALTER TABLE "Chunk" ADD COLUMN "journal" text;--> statement-breakpoint
ALTER TABLE "Chunk" ADD COLUMN "publish_year" real;--> statement-breakpoint
ALTER TABLE "Chunk" ADD COLUMN "usage_count" real DEFAULT 0;--> statement-breakpoint
ALTER TABLE "Chunk" ADD COLUMN "attributes" json;--> statement-breakpoint
ALTER TABLE "Chunk" ADD COLUMN "link" text;--> statement-breakpoint
ALTER TABLE "Chunk" ADD COLUMN "created_at" timestamp DEFAULT now();