# Optional AI/OCR backend

The mobile app is build-ready without a backend and includes a local text parser/demo CBT.

For full AI normalization/answer generation:
1. Copy `backend/.env.example` to `.env`.
2. Put your OpenAI API key in `OPENAI_API_KEY`.
3. Deploy the `backend` folder to a Node.js host.
4. Set `EXPO_PUBLIC_API_BASE_URL` in the Expo project to your HTTPS backend URL.
5. Add Firebase ID-token verification, App Check, authentication, rate limiting and restricted CORS before production.

Never put an OpenAI API key inside the APK.
