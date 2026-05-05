import { NativeModules, Platform } from 'react-native';
import { SMTP_CONFIG, ADMIN_EMAIL, EMAIL_SUBJECT_PREFIX } from '../config/constants';
import type { GeoPhoto } from '../types';

// The native module is registered as "RNSmtpMailer" in SmtpMailerModule.java
const { RNSmtpMailer } = NativeModules;

if (!RNSmtpMailer) {
  console.warn(
    '[emailService] RNSmtpMailer native module not found. ' +
    'Make sure you ran `expo prebuild` and rebuilt the Android project.',
  );
}

// ─── HTML email template ───────────────────────────────────────────────────

function buildHtmlBody(photo: GeoPhoto): string {
  const { location, address, capturedAt } = photo;
  const { latitude, longitude, altitude, accuracy, speed } = location.coords;

  const rows: { label: string; value: string }[] = [
    { label: 'Captured At', value: capturedAt.toLocaleString() },
    { label: 'Address',     value: address || 'Unknown' },
    { label: 'Latitude',    value: latitude.toFixed(8) },
    { label: 'Longitude',   value: longitude.toFixed(8) },
  ];
  if (altitude != null)          rows.push({ label: 'Altitude',    value: `${altitude.toFixed(2)} m` });
  if (accuracy != null)          rows.push({ label: 'GPS Accuracy', value: `±${accuracy.toFixed(0)} m` });
  if (speed != null && speed > 0) rows.push({ label: 'Speed',      value: `${speed.toFixed(1)} m/s` });

  const tableRows = rows
    .map(({ label, value }) => `
      <tr>
        <td style="padding:8px 14px;font-weight:600;color:#374151;background:#F9FAFB;
                   border:1px solid #E5E7EB;white-space:nowrap;">${label}</td>
        <td style="padding:8px 14px;color:#111827;border:1px solid #E5E7EB;
                   font-family:monospace,monospace;">${value}</td>
      </tr>`)
    .join('');

  return `
<!DOCTYPE html>
<html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;font-family:system-ui,sans-serif;background:#F3F4F6;">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;
              overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:#2563EB;padding:28px 32px;">
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;"> GeoPhoto Submission</h1>
      <p style="margin:6px 0 0;color:#BFDBFE;font-size:13px;">Sent via Inovation App</p>
    </div>
    <div style="padding:28px 32px;">
      <h2 style="margin:0 0 16px;font-size:14px;font-weight:700;color:#1F2937;
                 text-transform:uppercase;letter-spacing:0.5px;">Location Metadata</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px;">
        ${tableRows}
      </table>
      <p style="margin:0;font-size:13px;color:#6B7280;">The geotagged photo is attached.</p>
    </div>
    <div style="padding:16px 32px;background:#F9FAFB;border-top:1px solid #E5E7EB;">
      <p style="margin:0;font-size:12px;color:#9CA3AF;">Sent automatically by Inovation GeoPhoto App</p>
    </div>
  </div>
</body></html>`.trim();
}

// ─── Public API ────────────────────────────────────────────────────────────

export interface SendResult {
  success: boolean;
  message: string;
}

export async function sendGeoPhotoEmail(photo: GeoPhoto): Promise<SendResult> {
  if (!RNSmtpMailer) {
    return { success: false, message: 'SMTP native module unavailable (Android only).' };
  }

  if (Platform.OS !== 'android') {
    return { success: false, message: 'Gmail SMTP sending is only supported on Android in this build.' };
  }

  // Android file URIs are "file:///..." — strip the scheme for JavaMail FileDataSource
  const filePath = photo.uri.startsWith('file://')
    ? photo.uri.slice(7)
    : photo.uri;

  const fileName = `geophoto_${Date.now()}.jpg`;

  try {
    await RNSmtpMailer.sendMail({
      mailhost:        SMTP_CONFIG.host,
      port:            String(SMTP_CONFIG.port),
      ssl:             SMTP_CONFIG.ssl,
      username:        SMTP_CONFIG.username,
      password:        SMTP_CONFIG.password,
      from:            SMTP_CONFIG.from,
      recipients:      ADMIN_EMAIL,
      subject:         `${EMAIL_SUBJECT_PREFIX} — ${photo.capturedAt.toLocaleString()}`,
      htmlBody:        buildHtmlBody(photo),
      attachmentPaths: [filePath],
      attachmentNames: [fileName],
      attachmentTypes: ['image/jpeg'],
    });

    return { success: true, message: 'Email sent successfully.' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, message: msg };
  }
}
