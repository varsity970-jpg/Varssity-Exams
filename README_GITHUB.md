# VARSSITY EXAMS — GitHub / Cloud APK Build

CBT-style competitive exam app for NEET, JEE, EAPCET and custom exams.

## Build APK without Android Studio

1. Create a new GitHub repository.
2. Upload the contents of this folder.
3. Open the repository in GitHub Codespaces.
4. Run:

```bash
npm install
npm install -g eas-cli
eas login
eas build -p android --profile preview
```

The `preview` profile is configured to produce an **APK** through Expo's cloud build service.

### No Android Studio needed

You do not need Android Studio, the Android SDK, or a local Gradle installation for the cloud build.

## App branding

**VARSSITY EXAMS**  
**Founder: THILAK**

Exam categories include NEET, JEE, EAPCET and Custom.

## Secrets

Do not commit API keys or passwords. Use environment variables/secrets for the optional backend.
