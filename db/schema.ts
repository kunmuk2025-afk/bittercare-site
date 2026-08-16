import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const diaryEntries = sqliteTable(
  "diary_entries",
  {
    id: text("id").primaryKey(),
    caseId: text("case_id").notNull(),
    day: integer("day").notNull(),
    breed: text("breed").notNull(),
    note: text("note").notNull().default(""),
    comparison: text("comparison").notNull().default(""),
    approachCount: text("approach_count").notNull().default(""),
    chewed: text("chewed").notNull().default(""),
    bitterReaction: text("bitter_reaction").notNull().default(""),
    adhesion: text("adhesion").notNull().default(""),
    petName: text("pet_name").notNull().default(""),
    target: text("target").notNull().default(""),
    temperamentResult: text("temperament_result").notNull().default(""),
    helpRequested: integer("help_requested", { mode: "boolean" }).notNull().default(false),
    photoKey: text("photo_key"),
    photoType: text("photo_type"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("diary_case_day_unique").on(table.caseId, table.day),
    index("diary_case_idx").on(table.caseId),
  ],
);

export const assessmentEntries = sqliteTable(
  "assessment_entries",
  {
    id: text("id").primaryKey(),
    caseId: text("case_id").notNull(),
    assessmentType: text("assessment_type").notNull(),
    breed: text("breed").notNull(),
    petName: text("pet_name").notNull().default(""),
    language: text("language").notNull().default("ko"),
    answers: text("answers").notNull(),
    result: text("result").notNull(),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("assessment_case_type_unique").on(table.caseId, table.assessmentType),
    index("assessment_case_idx").on(table.caseId),
    index("assessment_updated_idx").on(table.updatedAt),
  ],
);

export const funnelEvents = sqliteTable(
  "funnel_events",
  {
    id: text("id").primaryKey(),
    caseId: text("case_id").notNull(),
    eventType: text("event_type").notNull(),
    breed: text("breed").notNull().default("unknown"),
    petName: text("pet_name").notNull().default(""),
    dogAge: text("dog_age").notNull().default(""),
    chewType: text("chew_type").notNull().default(""),
    chewingTarget: text("chewing_target").notNull().default(""),
    language: text("language").notNull().default("ko"),
    screen: text("screen").notNull().default(""),
    store: text("store").notNull().default(""),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [
    index("funnel_event_type_idx").on(table.eventType),
    index("funnel_case_idx").on(table.caseId),
    index("funnel_created_idx").on(table.createdAt),
  ],
);

export const observationSessions = sqliteTable(
  "observation_sessions",
  {
    id: text("id").primaryKey(),
    caseId: text("case_id").notNull(),
    breed: text("breed").notNull(),
    petName: text("pet_name").notNull().default(""),
    dogAge: text("dog_age").notNull().default(""),
    target: text("target").notNull().default(""),
    temperamentResult: text("temperament_result").notNull().default(""),
    language: text("language").notNull().default("ko"),
    status: text("status").notNull().default("active"),
    startedAt: integer("started_at").notNull(),
    completedAt: integer("completed_at"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    index("observation_session_case_idx").on(table.caseId),
    index("observation_session_status_idx").on(table.caseId, table.status),
    index("observation_session_updated_idx").on(table.updatedAt),
  ],
);

export const observationEntries = sqliteTable(
  "observation_entries",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id").notNull(),
    caseId: text("case_id").notNull(),
    day: integer("day").notNull(),
    note: text("note").notNull().default(""),
    comparison: text("comparison").notNull().default(""),
    approachCount: text("approach_count").notNull().default(""),
    chewed: text("chewed").notNull().default(""),
    bitterReaction: text("bitter_reaction").notNull().default(""),
    adhesion: text("adhesion").notNull().default(""),
    helpRequested: integer("help_requested", { mode: "boolean" }).notNull().default(false),
    photoKey: text("photo_key"),
    photoType: text("photo_type"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("observation_session_day_unique").on(table.sessionId, table.day),
    index("observation_entry_session_idx").on(table.sessionId),
    index("observation_entry_case_idx").on(table.caseId),
  ],
);

export const observationReports = sqliteTable(
  "observation_reports",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id").notNull(),
    caseId: text("case_id").notNull(),
    resultType: text("result_type").notNull(),
    summary: text("summary").notNull(),
    summaryData: text("summary_data").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("observation_report_session_unique").on(table.sessionId),
    index("observation_report_case_idx").on(table.caseId),
    index("observation_report_created_idx").on(table.createdAt),
  ],
);
