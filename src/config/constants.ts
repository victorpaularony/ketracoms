// ─── Admin Configuration ───────────────────────────────────────────────────
// The email address that receives every photo submission
export const ADMIN_EMAIL = 'victorpaularony@example.com';

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
  host: 'smtp.gmail.com',
  port: 465,          // SSL port — use 587 if you prefer STARTTLS (set ssl: false)
  ssl: true,
  username: 'address@gmail.com',   // ← change this
  password: 'xxxx xxxx xxxx xxxx',            // ← 16-char App Password
  from: 'your-gmail-address@gmail.com',       // ← same as username
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
