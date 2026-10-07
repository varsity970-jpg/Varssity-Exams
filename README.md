# VARSSITY EXAMS — Cloud Build Edition

Founder: THILAK

This is the browser/cloud-build version of Varssity Exams. It uses Expo + React Native and is configured for EAS Build.

## What is already included

- VARSSITY EXAMS branding
- Founder: THILAK
- NEET / JEE / EAPCET / CUSTOM exam types
- CBT exam screen
- Countdown timer
- Radio-button answer selection
- Previous / Next navigation
- Automatic submission and scoring
- Correct / wrong / unattempted / accuracy result memo
- Session exam history
- JPG/PNG/PDF picker UI
- Text question-paper parser
- Optional AI/OCR backend scaffold
- EAS APK build profile

## Cloud APK build

Expo EAS Build is a hosted build service. The included `eas.json` has a `preview` profile that produces an installable Android APK.

Recommended browser-friendly workflow:
1. Put this project in GitHub.
2. Open a GitHub Codespace (or another browser terminal).
3. Run:
   `npm install`
4. Run:
   `npx eas login`
5. Run:
   `eas build --platform android --profile preview`
6. EAS will give a build page/link. When complete, download the APK.

No Android Studio is required for the cloud build.

## Important

The APK build is ready, but full production PDF/JPG OCR, Firebase authentication, answer-key AI and cloud result sync still require backend/Firebase configuration. The app intentionally keeps the OpenAI key off-device.

## Package

Android application ID:
`com.varssity.exams`
