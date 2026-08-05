CREATE TABLE IF NOT EXISTS access_tokens (id TEXT PRIMARY KEY, token_hash TEXT UNIQUE NOT NULL, incident_id TEXT UNIQUE NOT NULL, expires_at INTEGER NOT NULL, used_at INTEGER, created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, session_hash TEXT UNIQUE NOT NULL, incident_id TEXT NOT NULL, expires_at INTEGER NOT NULL, revoked_at INTEGER, created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS incidents (id TEXT PRIMARY KEY, reporter_name TEXT, reporter_phone TEXT, victim_count INTEGER DEFAULT 1, victim_condition TEXT, description TEXT, latitude REAL, longitude REAL, accuracy REAL, evidence_key TEXT, status TEXT DEFAULT 'menunggu_verifikasi', ambulance_code TEXT, hospital_name TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS idx_sessions_hash ON sessions(session_hash);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
INSERT OR IGNORE INTO incidents (id,status,ambulance_code,hospital_name,created_at,updated_at) VALUES ('DEMO-SMG-001','ambulans_menuju_lokasi','AMB-HEBAT-07','RSUP Dr. Kariadi',strftime('%s','now'),strftime('%s','now'));
