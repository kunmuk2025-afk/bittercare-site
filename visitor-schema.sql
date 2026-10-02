-- Run once in the Cloudflare D1 console. Never reset this table during a version update.
CREATE TABLE IF NOT EXISTS visits (
  day TEXT NOT NULL,
  session TEXT NOT NULL,
  PRIMARY KEY (day, session)
) WITHOUT ROWID;
