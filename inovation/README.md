# Inovation — GeoPhoto App

A React Native (Expo) Android app that captures geotagged photos and emails them to an admin via Gmail SMTP.

---

## Project structure

```
├── App.tsx
├── app.json                         ← Expo config + Android permissions
├── package.json
├── src/
│   ├── config/
│   │   └── constants.ts             ← ADMIN_EMAIL + SMTP_CONFIG  ← edit here
│   ├── services/
│   │   └── emailService.ts          ← Gmail SMTP send logic
│   ├── navigation/
│   │   └── TabNavigator.tsx
│   ├── screens/
│   │   ├── PhotoScreen.tsx          ← Camera + GPS + submit
│   │   └── FormScreen.tsx           ← Placeholder (future)
│   └── types/index.ts
└── assets/
```

---

## Step 1 — Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 18+ |
| Java JDK | 17 (Android Studio bundles this) |
| Android Studio | Hedgehog or newer |
| Android SDK | API 34 |

Install the Expo CLI globally if you haven't already:

```bash
npm install -g expo-cli
```

---

## Step 2 — Install dependencies

```bash
cd /home/vic/projects/inovation
npm install
```

---

## Step 3 — Configure Gmail SMTP

Open `src/config/constants.ts` and fill in your credentials:

```ts
export const ADMIN_EMAIL = 'admin@yourcompany.com';   // who receives the photos

export const SMTP_CONFIG = {
  host: 'smtp.gmail.com',
  port: 465,
  ssl: true,
  username: 'sender@gmail.com',         // Gmail address used to send
  password: 'abcd efgh ijkl mnop',      // 16-char App Password (see below)
  from: 'sender@gmail.com',
};
```

### Getting a Gmail App Password

1. Enable 2-Step Verification on the Gmail account:
   `myaccount.google.com → Security → 2-Step Verification`

2. Generate an App Password:
   `myaccount.google.com → Security → App passwords`
   → Select **Mail** + **Android device** → **Generate**

3. Copy the 16-character password (spaces optional) into `SMTP_CONFIG.password`.

> Never use your regular Gmail password — Google blocks it for 3rd-party SMTP.

---

## Step 4 — Generate the Android native project

This command generates the `android/` folder from the Expo config:

```bash
npx expo prebuild --platform android --clean
```

You only need to re-run this if you add new native packages or change `app.json` permissions.

---

## Step 5 — Open in Android Studio

1. Open **Android Studio**
2. **File → Open** → select the `android/` folder inside this project
3. Wait for Gradle sync to complete
4. Plug in your Android phone (enable **USB Debugging** in Developer Options)
5. Press the green **Run** button (▶)

### Or run from the terminal

```bash
npm run android
# which runs: expo run:android
```

---

## Building a Standalone APK (Release)

A **Release** build embeds the JavaScript bundle (`index.android.bundle`) directly inside the APK so the app runs standalone on any Android device without needing Metro or a USB connection to your computer.

### Build the APK

From the project root:

```bash
cd android
./gradlew app:assembleRelease
```

Or build and install directly onto a USB-connected phone in one step:

```bash
npx expo run:android --variant release
```

> **Note:** Make sure `android/local.properties` contains `sdk.dir=/path/to/Android/Sdk` (or `ANDROID_HOME` is set in your shell), especially after running `expo prebuild --clean`.

### Where to find the built APK

The generated APK is located at:

```text
android/app/build/outputs/apk/release/app-release.apk
```

You can copy `app-release.apk` to any Android phone and install it, or install it via ADB:

```bash
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

> **Signing note:** In `android/app/build.gradle`, the `release` build type currently signs with `signingConfigs.debug` for local/internal testing. Before publishing to the Google Play Store, replace this with your own release keystore.

---

## Step 6 — First-time phone setup

On your Android device:

1. Settings → About phone → tap **Build number** 7 times to enable Developer Options
2. Settings → Developer options → enable **USB debugging**
3. Connect via USB and accept the "Allow USB debugging?" prompt

---

## How the app works

### Camera tab

| Step | What happens |
|------|-------------|
| App opens | Requests Camera, Location, and Media Library permissions |
| Viewfinder | Real-time GPS address shown as overlay badge on the camera |
| Live panel | Lat / Lng / Alt chips update every 4 seconds / 5 metres |
| Shutter tap | Photo is captured; location is frozen into the `GeoPhoto` object |
| Preview | Photo shown with location watermark; full metadata card below |
| **Submit** | 1) Saves photo to gallery · 2) Sends via Gmail SMTP with photo attached |

### Form tab

Placeholder — will be implemented in a future sprint.

---

## Email format

**Subject:** `GeoPhoto Report — 4/16/2026, 10:32:05 AM`

**Body:** HTML email with a metadata table (address, lat, lng, altitude, accuracy).

**Attachment:** the captured JPEG.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `Authentication failed` | Use an App Password, not your Gmail password |
| `Connection refused` | Ensure the device has internet access; try port 587 with `ssl: false` |
| Camera black screen | Use a physical device — emulators have no real camera |
| GPS shows "Acquiring…" | Go outdoors or near a window; emulators return mock coordinates |
| Gradle sync fails | Android Studio → File → Invalidate Caches & Restart |
