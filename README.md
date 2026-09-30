# AI Chatbot

An intelligent, full-stack conversational AI application built with React, Node.js, Express, MongoDB, and the Google Gemini API using the official `@google/genai` SDK.

This project includes a polished dark-mode interface, guest and Google auth flows, persistent conversation history, markdown rendering, and AI-powered chat responses.

---

## Deployed URL

* Frontend: https://aichatbot-zeta-ochre.vercel.app/
* Backend health check: https://aichatbot-79nb.onrender.com/api/health

---

## ✨ Key Features

* Google Gemini integration with `gemini-3.6-flash`
* Multi-turn conversation memory
* Modern glassmorphic dark UI
* Markdown rendering with syntax-highlighted code blocks and copy buttons
* Persistent chat history in MongoDB
* Google OAuth and guest name sign-in
* Express validation and graceful error handling

---

## 🛠️ Technology Stack

* Frontend: React 19, Vite 6, Vanilla CSS
* Backend: Node.js 18+, Express 5, Mongoose 8
* Database: MongoDB (local or Atlas)
* AI: Google Gemini API via `@google/genai`
* Auth: Google Identity Services + `google-auth-library`

---

## 📂 Project Structure

```text
AIchatbot/
├── backend/
│   ├── server.js          # REST server, Gemini AI integration, auth, and history routes
│   ├── package.json       # Backend dependencies and scripts
│   ├── .env.example       # Example backend environment config
│   └── .env               # Local environment settings (ignored by git)
├── frontend/
│   ├── index.html         # App entry HTML with Google Identity client
│   ├── package.json       # Frontend dependencies and scripts
│   ├── vite.config.js     # Vite configuration
│   ├── .env.example       # Example frontend environment config
│   ├── .env               # Local environment settings (ignored by git)
│   └── src/
│       ├── App.jsx        # App shell and state management
│       ├── api.js         # Shared API helper
│       ├── main.jsx       # React entry point
│       ├── styles.css     # Design system and layout styling
│       └── components/
│           ├── ChatWindow.jsx
│           ├── HistoryDrawer.jsx
│           ├── IdentityPrompt.jsx
│           └── MarkdownRenderer.jsx
├── README.md
└── package-lock.json
```

---

## ⚙️ Quick Start & Setup

### Prerequisites

* Node.js 18 or newer
* MongoDB running locally or an Atlas connection string
* A Gemini API key from Google AI Studio
* Optional Google OAuth client ID

### Step 1: Backend Setup

1. Open a terminal and go to the backend folder:
   ```bash
   cd backend
   ```

2. Copy the example environment file:
   ```bash
   copy .env.example .env
   ```

3. Update `.env` with your values:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_MODEL=gemini-3.6-flash
   MONGODB_URI=mongodb://127.0.0.1:27017/aichatbot
   PORT=3060
   FRONTEND_URL=http://localhost:5173
   GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
   DNS_SERVERS=8.8.8.8,1.1.1.1
   ```

4. Install dependencies and run the backend:
   ```bash
   npm install
   npm run dev
   ```

### Step 2: Frontend Setup

1. Open a new terminal and go to the frontend folder:
   ```bash
   cd frontend
   ```

2. Copy the example frontend env file:
   ```bash
   copy .env.example .env
   ```

3. Set values in `.env`:
   ```env
   VITE_API_URL=http://localhost:3060
   VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
   ```

4. Start the app:
   ```bash
   npm install
   npm run dev
   ```

Open http://localhost:5173 in your browser.

---

## 📡 API Endpoints

### 1. POST /api/chat

Create or continue a conversation and get an AI reply.

Request body:
```json
{
  "conversationId": "65ebd1692e85ab361cc38ab4",
  "userName": "Alex",
  "message": "Explain how async/await works in JavaScript."
}
```

Response:
```json
{
  "conversationId": "65ebd1692e85ab361cc38ab4",
  "message": {
    "role": "assistant",
    "content": "Async/await in JavaScript provides...",
    "createdAt": "2026-09-30T07:15:00.000Z"
  }
}
```

### 2. GET /api/chat/history

Returns conversations for the current user identity.

### 3. GET /api/chat/history/:id

Returns a single conversation with its full message history.

### 4. DELETE /api/chat/history/:id

Deletes a conversation by ID.

### 5. GET /api/health

Returns the server status and MongoDB connection state.

---

## 🧠 Data Model

The app stores each conversation as a document with embedded messages for fast reads and simple access patterns.

Fields include:

* `userId` — unique guest or Google identity key
* `userName` — user display name
* `userEmail` — optional Google email address
* `title` — generated conversation title
* `messages[]` — message objects with role, content, and createdAt

---

## 🛡️ License

MIT License.
