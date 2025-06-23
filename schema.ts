import { Message } from "ai";
import { InferSelectModel } from "drizzle-orm";
import {
  pgTable,
  varchar,
  text,
  real,
  timestamp,
  json,
  integer,
} from "drizzle-orm/pg-core";

export const user = pgTable("User", {
  email: varchar("email", { length: 64 }).primaryKey().notNull(),
  password: varchar("password", { length: 64 }),
});

export const chat = pgTable("Chat", {
  id: text("id").primaryKey().notNull(),
  createdAt: timestamp("createdAt").notNull(),
  messages: json("messages").notNull(),
  author: varchar("author", { length: 64 })
    .notNull()
    .references(() => user.email),
});

export const chunk = pgTable("Chunk", {
  id: text("id").primaryKey().notNull(),
  filePath: text("filePath").notNull(),
  content: text("content").notNull(),
  embedding: real("embedding").array().notNull(),
  // Journal-specific fields for the challenge
  sourceDocId: text("sourceDocId"),
  chunkIndex: integer("chunkIndex"),
  sectionHeading: text("sectionHeading"),
  doi: text("doi"),
  journal: text("journal"),
  publishYear: integer("publishYear"),
  usageCount: integer("usageCount").default(0),
  attributes: json("attributes").$type<string[]>(),
  link: text("link"),
});

export type Chat = Omit<InferSelectModel<typeof chat>, "messages"> & {
  messages: Array<Message>;
};

export type Chunk = InferSelectModel<typeof chunk>;

// Additional type for journal chunk data
export interface JournalChunk {
  id: string;
  source_doc_id: string;
  chunk_index: number;
  section_heading: string;
  doi: string;
  journal: string;
  publish_year: number;
  usage_count: number;
  attributes: string[];
  link: string;
  text: string;
}
