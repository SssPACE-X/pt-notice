-- Run this SQL in your Supabase SQL Editor

-- 1. Patients Table
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reg_no TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'waiting', -- waiting | assigned | discharged
  schedule TEXT, -- mon_wed | tue_thu | dc
  assigned_at TIMESTAMPTZ,
  discharged_at TIMESTAMPTZ,
  ward_room TEXT,
  diagnosis TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Treatment Checks Table 
-- This will store daily V / X status. A row represents a single day for a patient.
CREATE TABLE treatment_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  check_date DATE DEFAULT CURRENT_DATE,
  check_state TEXT DEFAULT 'none', -- none | done | missed
  missed_reason TEXT,
  UNIQUE(patient_id, check_date)
);

-- 3. Push Subscriptions Table
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Set up Realtime
-- Enable Realtime for patients
ALTER PUBLICATION supabase_realtime ADD TABLE patients;
-- Enable Realtime for treatment_checks
ALTER PUBLICATION supabase_realtime ADD TABLE treatment_checks;

-- Set basic Row Level Security Policies (Allow ALL for MVP)
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for patients" ON patients FOR ALL USING (true);

ALTER TABLE treatment_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for treatment_checks" ON treatment_checks FOR ALL USING (true);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for push_subscriptions" ON push_subscriptions FOR ALL USING (true);
