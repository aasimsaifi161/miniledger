# MiniLedger

MiniLedger is a personal finance and loan tracking mobile app designed to help users keep track of money lent to friends, monitor overdue balances, record repayments, and store receipts.

---

## Tech Stack

- **Frontend (`/app`)**: React Native, Expo (SDK 54), Expo Router, TypeScript, TanStack React Query, Expo SecureStore.
- **Backend (`/backend`)**: Node.js, Express, TypeScript, Prisma ORM, PostgreSQL, JWT Authentication, Multer, Vitest.

---

## Project Structure

```text
miniledger/
├── app/                  # Expo React Native mobile application
│   ├── src/
│   │   ├── app/          # File-based routes (Login, Dashboard, Add Loan)
│   │   ├── components/   # Reusable UI components
│   │   ├── hooks/        # React Query hooks
│   │   └── lib/          # API client, auth, formatters, and theme
│   └── app.json
│
├── backend/              # Node.js + Express REST API
│   ├── prisma/           # Prisma schema & migrations
│   ├── src/              # Controllers, routes, db connection, middlewares
│   ├── tests/            # Vitest integration test suite
│   └── uploads/          # Receipt uploads directory
│
├── .gitignore
└── README.md
```

---

## Features

- **OTP Authentication**: Phone-based authentication with 6-digit verification code.
- **Metrics Dashboard**: Summary card displaying Total Lent, Total Repaid, and Overdue Amount.
- **Loan Management**:
  - Filter loans by All, Active, Repaid, and Overdue.
  - Record loans with friend's name, amount, and custom due date picker.
  - Mark loans as repaid with one tap.
  - Delete loan records.
- **Receipt Uploads**: Attach image receipts directly to loan records via multipart upload.

---

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm or yarn
- PostgreSQL database (local or cloud like Neon / Supabase)
- Expo Go app installed on your physical mobile device (or Android Studio / Xcode emulator)

---

### 1. Backend Setup

1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file from the example template:
   ```bash
   cp .env.example .env
   ```
   Set your database credentials and a JWT secret:
   ```env
   PORT=4000
   DATABASE_URL="postgresql://username:password@localhost:5432/miniledger?schema=public"
   JWT_SECRET="your-jwt-secret-key"
   ```

4. Push the Prisma database schema:
   ```bash
   npx prisma db push
   ```

5. Start the backend development server:
   ```bash
   npm run dev
   ```
   The server will start at `http://localhost:4000`.

6. *(Optional)* Run backend test suites:
   ```bash
   npm test
   ```

---

### 2. Frontend Setup (Mobile App)

1. Open another terminal and navigate to the app directory:
   ```bash
   cd app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file from the example template:
   ```bash
   cp .env.example .env
   ```
   Set the API URL:
   - For web or iOS simulator:
     ```env
     EXPO_PUBLIC_API_URL=http://localhost:4000
     ```
   - For physical device running Expo Go (use your computer's local Wi-Fi IP):
     ```env
     EXPO_PUBLIC_API_URL=http://<YOUR_LOCAL_IP>:4000
     ```

4. Start the Expo development server:
   ```bash
   npx expo start -c
   ```

5. Open the app:
   - Press `w` to open in browser.
   - Or scan the terminal QR code using **Expo Go** on Android or the Camera app on iOS.

---

## Demo Credentials

- **Phone Number**: Any valid 10-digit number (e.g. `9876543210`)
- **OTP**: Use `654321` (default static code in development)
