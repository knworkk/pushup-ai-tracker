# ⚡ PushUp AI - Computer Vision Posture Coach & Rep Counter

An AI-powered fitness web application built with **React 18, TypeScript, Tailwind CSS, MediaPipe Tasks Vision**, and **Supabase**. It runs client-side machine learning to track pushups from a side-view camera profile, calculates joint angles in real time, warns against dangerous posture faults, logs workouts to a calendar, and powers live community leaderboards.

![PushUp AI Banner](public/favicon.svg)

---

## 🌟 Key Features

- **100% Client-Side Machine Learning**: Runs Google's **MediaPipe Pose (WASM + WebGL)** directly inside the browser. Zero video stream leaves the user's device (100% private, zero server latency).
- **Biomechanical Angle Engine**: Exact 3D vector calculations with Exponential Moving Average (EMA) smoothing for jitter-free tracking.
- **Pushup Style Profiles (Men vs Women / Standard vs Knee Pushups)**:
  - **Standard Pushup (Men / Toes)**: Evaluates the straight plank line from **Shoulder &rarr; Hip &rarr; Ankle** ($165^\circ - 180^\circ$) and requires knees locked and elevated.
  - **Knee Pushup (Women / Modified)**: Evaluates the straight spine line from **Shoulder &rarr; Hip &rarr; Knee** ($165^\circ - 180^\circ$). Resting knees on the floor is allowed and expected, while still enforcing full $\le 90^\circ$ elbow depth.
- **Harmful Posture Prevention**: Detects lumbar hyperextension (sagging lower back), piked hips, neck craning, and incomplete range of motion.
- **AI Voice Coach & Audio FX**: Real-time voice coaching via Web Speech API and audio chimes via Web Audio API.
- **Workout Calendar**: Interactive monthly calendar tracking reps, sets, average form score, duration, and calories burned.
- **Leaderboard & Friend Challenges**: Community leaderboards and shareable friend challenge cards.
- **Laptop & Mobile Optimized**: Responsive side-by-side cockpit layout designed for laptops, tablets, and mobile phones (supports front and rear camera switching).

---

## 🚀 Quick Start (Local Development)

```bash
# Clone the repository
git clone https://github.com/knworkk/pushup-ai-tracker.git
cd pushup-ai-tracker

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 🗄️ Backend Setup: Supabase (Free Database)

1. Create a free account at [supabase.com](https://supabase.com) and create a new project.
2. In the Supabase Dashboard, go to **SQL Editor** &rarr; **New query**.
3. Copy and paste the contents of `supabase_schema.sql` (included in this repository) and click **Run**.
4. Go to **Project Settings** &rarr; **API** and copy:
   - `Project URL`
   - `anon public key`
5. Connect it to your app:
   - **Method A (No Rebuild Needed)**: Open the app &rarr; Click **Settings** (gear icon) &rarr; Paste your URL and Key in the **Cloud Database (Supabase)** section.
   - **Method B (Environment Variables)**: Create a `.env` file from `.env.example`:
     ```env
     VITE_SUPABASE_URL=https://your-project-id.supabase.co
     VITE_SUPABASE_ANON_KEY=eyJhbGci...
     ```

---

## 🌐 Deploying to Vercel (1-Click)

1. Go to [vercel.com/new](https://vercel.com/new).
2. Sign in with GitHub and select **`knworkk/pushup-ai-tracker`**.
3. (Optional) Add your Supabase environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Click **Deploy**. Vercel will build and launch your live HTTPS website in under 1 minute!

---

## 📐 Biomechanical Angle Guide

| Position | Elbow Joint | Spine Alignment (Standard) | Spine Alignment (Knee Mode) |
| :--- | :--- | :--- | :--- |
| **UP (Standby)** | $160^\circ - 180^\circ$ | $165^\circ - 180^\circ$ (Shoulder-Hip-Ankle) | $165^\circ - 180^\circ$ (Shoulder-Hip-Knee) |
| **DOWN (Inflection)** | $\le 90^\circ$ | $165^\circ - 180^\circ$ | $165^\circ - 180^\circ$ |
| **Fault: Sagging Hips** | Any | $< 155^\circ$ dipped downward | $< 155^\circ$ dipped downward |
| **Fault: Piked Hips** | Any | $< 155^\circ$ peaked upward | $< 155^\circ$ peaked upward |

---

## 📄 License
MIT License. Built with ❤️ for athletes and fitness enthusiasts.
