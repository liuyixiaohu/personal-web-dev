CREATE TABLE subscribers (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  email_normalized TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'unsubscribed')),
  confirm_token_hash TEXT UNIQUE,
  confirm_expires_at TEXT,
  unsubscribe_token TEXT NOT NULL UNIQUE,
  last_confirmation_sent_at TEXT,
  confirmed_at TEXT,
  unsubscribed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX subscribers_status_idx ON subscribers (status);

CREATE TABLE notification_runs (
  updated_at TEXT PRIMARY KEY,
  new_event_count INTEGER NOT NULL CHECK (new_event_count >= 0),
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  started_at TEXT NOT NULL,
  attempt_started_at TEXT,
  completed_at TEXT,
  error TEXT
);

CREATE TABLE deliveries (
  id TEXT PRIMARY KEY,
  run_updated_at TEXT NOT NULL REFERENCES notification_runs(updated_at) ON DELETE CASCADE,
  subscriber_id TEXT NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  batch_index INTEGER NOT NULL CHECK (batch_index >= 0),
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed')),
  resend_email_id TEXT,
  sent_at TEXT,
  error TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (run_updated_at, subscriber_id)
);

CREATE INDEX deliveries_run_batch_idx ON deliveries (run_updated_at, batch_index, status);
