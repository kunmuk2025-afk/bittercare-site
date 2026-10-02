-- V14 additive migration. Execute against the SAME VISITOR_DB used by V13.
-- Never drop or clear visits when upgrading.
CREATE TABLE IF NOT EXISTS visits (day TEXT NOT NULL, session TEXT NOT NULL, PRIMARY KEY(day,session)) WITHOUT ROWID;
CREATE INDEX IF NOT EXISTS visits_session ON visits(session);
CREATE TABLE IF NOT EXISTS page_stats (day TEXT NOT NULL,path TEXT NOT NULL,language TEXT NOT NULL,views INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(day,path,language)) WITHOUT ROWID;
CREATE TABLE IF NOT EXISTS inquiries (id TEXT PRIMARY KEY,created_at INTEGER NOT NULL,name TEXT NOT NULL,email TEXT NOT NULL,category TEXT NOT NULL,subject TEXT NOT NULL,message TEXT NOT NULL,language TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'new',note TEXT NOT NULL DEFAULT '',updated_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS inquiries_created ON inquiries(created_at);
CREATE TABLE IF NOT EXISTS admin_sessions (token_hash TEXT PRIMARY KEY,expires INTEGER NOT NULL,credential_hash TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY,count INTEGER NOT NULL,expires INTEGER NOT NULL);
