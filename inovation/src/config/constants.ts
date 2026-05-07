// ─── Supabase Configuration ───────────────────────────────────────────────
// Get these from: Supabase Dashboard → Project Settings → API
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://bfghnmtjjzxgebtcixdq.supabase.co';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmZ2hubXRqanp4Z2VidGNpeGRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5NjA5NDEsImV4cCI6MjA5MzUzNjk0MX0.CHwpTZR6XuOCdM2FznEErerpZAH8HGTC8aYE-7xIhXE';
export const SUPABASE_BUCKET = process.env.EXPO_PUBLIC_SUPABASE_BUCKET || 'geo-photos';

// ─── Admin Configuration ───────────────────────────────────────────────────
// The email address that receives every photo submission
export const ADMIN_EMAIL = process.env.EXPO_PUBLIC_ADMIN_EMAIL || 'smallypauls@gmail.com';

// Subject line prefix for every outgoing email
export const EMAIL_SUBJECT_PREFIX = 'GeoPhoto Report';

// ─── Gmail SMTP Configuration ─────────────────────────────────────────────
// IMPORTANT: Use a Gmail App Password, NOT your regular account password.
//   1. Go to myaccount.google.com → Security → 2-Step Verification (must be ON)
//   2. Go to myaccount.google.com → Security → App passwords
//   3. Generate a new App Password for "Mail" / "Android device"
//   4. Paste the 16-character password below (no spaces)
//
// Never commit real credentials to source control.
export const SMTP_CONFIG = {
  host: process.env.EXPO_PUBLIC_SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EXPO_PUBLIC_SMTP_PORT || '465'),          // SSL port — use 587 if you prefer STARTTLS (set ssl: false)
  ssl: true,
  username: process.env.EXPO_PUBLIC_SMTP_USERNAME || 'smallypauls@gmail.com',   // ← change this
  password: process.env.EXPO_PUBLIC_SMTP_PASSWORD || 'mwaw xohy byzb hrvf',            // ← 16-char App Password
  from: process.env.EXPO_PUBLIC_SMTP_USERNAME || 'smallypauls@gmail.com',       // ← same as username
};

// ─── App Theme ────────────────────────────────────────────────────────────
export const COLORS = {
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  primaryLight: '#DBEAFE',
  accent: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceAlt: '#F1F5F9',
  border: '#E2E8F0',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0,0,0,0.55)',
};
