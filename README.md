# CyVigilant AI Customer Support Assistant

An AI-powered customer support chatbot built with **React**, **Node.js**, **Express**, **MongoDB**, and **Google Gemini API**. 

This application demonstrates a clean, responsive user interface, robust schema validation, secure Google OAuth authentication, and error resilience.

---

## Deployed URL
* **Frontend:** [https://aichatbot-zeta-ochre.vercel.app/](https://aichatbot-zeta-ochre.vercel.app/)
* **Backend Status Health Check:** https://aichatbot-79nb.onrender.com/api/health *(Hosted on Render)*

---

## Tech-Stack & AI Integration

* **Frontend:** React.js, Vite, Vanilla js.
* **Backend:** Node.js, Express.js (v5.x), Mongoose.
* **Database:** MongoDB (Atlas).
* **AI Provider:** **Google Gemini API** using the official, high-efficiency `@google/genai` SDK and the `gemini-3.6-flash`(cause it was free and fastest available) model.

---

## Data Modeling

The database is built on a single collection designed for simplicity.

### Collection: `conversations`
Mongoose schema structure:
* **`userId`** (`String`, Indexed): Stores either a unique Google identifier (e.g., `google:<sub_id>`) or a normalized string name (e.g., `name:alex`) for guest visitors.
* **`userName`** (`String`): The display name of the user.
* **`userEmail`** (`String`, Optional): Google email address when signed in via OAuth.
* **`title`** (`String`): A generated title derived from the first message sent in the thread.
* **`messages`**: An embedded array of message sub-documents:
  * **`role`** (`String`, Enum `['user', 'assistant']`): Tracks who sent the message.
  * **`content`** (`String`): The plaintext message body.
  * **`createdAt`** (`Date`): Timestamp automatically populated for each individual message.

### Why This Model Was Selected:
1. **High Read Performance:** By embedding messages directly inside the parent conversation document, we load the entire chat history in a single, fast O(1) query without performing complex database joins.
2. **Simplified Relationships:** Linking conversations to users via a simple indexed `userId` allows easy querying of historical archives.
3. **Atomic Writes:** Appending messages to an array is atomic in MongoDB, preventing write collision issues in multi-tab sessions.

---

##  Project Organization

The repository is divided into two self-contained directories:

```text
CyVigilant_cs/
├── backend/
│   ├── server.js          # REST Server, AI integration, Google ID validation, & routes
│   ├── package.json       # Backend script definitions and modules
│   └── .env.example       # Example template for backend environments
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatWindow.jsx       # Chat window, composer, and messages list
│   │   │   ├── HistoryDrawer.jsx    # Sidebar drawer for chat histories
│   │   │   └── IdentityPrompt.jsx   # Portal entrance (Guest name entry / Google Sign-In)
│   │   ├── api.js         # Centralized HTTP request helper
│   │   ├── App.jsx        # Root component handling application state and logic
│   │   ├── main.jsx       # App entrypoint
│   │   └── styles.css     # UI design styles, variables, and typography
│   ├── package.json       # React / Vite packages
│   └── .env.example       # Example template for frontend environment
└── README.md
```

---

## Environment Configuration & Installation

### Prerequisites
* Node.js 18 or newer.
* A running MongoDB database (local or Atlas cluster).
* A **Gemini API Key** (obtainable from Google AI Studio).
* An optional **Google OAuth Client ID** (from Google Cloud Console).

---

### Step 1: Clone and Configure the Backend
1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Copy the environment template:
   ```bash
   cp .env.example .env
   ```
3. Populate your `.env` values:
   ```env
   GEMINI_API_KEY=your_gemini_api_key
   GEMINI_MODEL=gemini-3.6-flash
   MONGODB_URI=mongodb://127.0.0.1:27017/cyvigilant_support
   PORT=3060
   FRONTEND_URL=http://localhost:5173
   GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
   ```
4. Install dependencies and start the developer server:
   ```bash
   npm install
   npm run dev
   ```
   The backend API will run at `http://localhost:3060`.

---

### Step 2: Configure the Frontend
1. Navigate to the `frontend/` directory:
   ```bash
   cd ../frontend
   ```
2. Copy the environment template:
   ```bash
   cp .env.example .env
   ```
3. Update the `.env` settings:
   ```env
   VITE_API_URL=http://localhost:3060
   VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
   ```
4. Install dependencies and start the dev server:
   ```bash
   npm install
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

## API Documentation

### `POST /api/chat`
Creates or appends a message to a conversation thread.
* **Headers:** `Authorization: Bearer <Google_Token>` (Optional for guest users)
* **Request Body:**
  ```json
  {
    "conversationId": "65ebd1692e85ab361cc38ab4", // Optional (create new if omitted)
    "userName": "Alex", // Required for guest identity
    "message": "Hello, how do I reset my password?"
  }
  ```
* **Success Response:** `200 OK`
  ```json
  {
    "conversationId": "65ebd1692e85ab361cc38ab4",
    "message": {
      "role": "assistant",
      "content": "To reset your password...",
      "createdAt": "2026-08-20T04:40:00.000Z"
    }
  }
  ```

### `GET /api/chat/history`
Retrieves all historical conversations matching the active identity.
* **Query Parameter:** `?userName=Alex` (Used if Google Token is not present)
* **Success Response:** `200 OK` returns list of conversations sorted by latest updates first.

### `GET /api/chat/history/:id`
Retrieves detail contents (including message arrays) of a specific conversation.

### `DELETE /api/chat/history/:id`
Permanently deletes a conversation from history.

### `GET /api/health`
Responds with server uptime and current database connection status.

