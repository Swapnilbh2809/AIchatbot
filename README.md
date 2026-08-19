# CyVigilant AI Support Assistant

CyVigilant is a customer support chatbot built with React, Node.js, Express, MongoDB, and Google's Gemini API.

Users can start a conversation with a display name or sign in with Google. Conversations are saved in MongoDB and can be reopened or deleted from the history drawer.

## Features

- Responsive React chat interface
- Display-name or Google sign-in entry flow
- Gemini-powered support responses
- MongoDB conversation storage
- Conversation history drawer
- Reopen and delete previous conversations
- Typing indicator while Gemini responds
- Request validation and user-facing error messages
- Reusable frontend components

## Project structure

```text
CyVigilant_cs/
├── backend/
│   ├── server.js
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatWindow.jsx
│   │   │   ├── HistoryDrawer.jsx
│   │   │   └── IdentityPrompt.jsx
│   │   ├── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── package.json
│   └── .env.example
└── README.md
```

## Requirements

- Node.js 18 or newer
- MongoDB local server or MongoDB Atlas
- Gemini API key
- Google OAuth Web Client ID if Google sign-in is enabled

## Run locally

### 1. Configure the backend

```powershell
cd backend
Copy-Item .env.example .env
```

Edit `backend/.env`:

```env
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-3.6-flash
MONGODB_URI=mongodb://127.0.0.1:27017/cyvigilant_support
PORT=3060
FRONTEND_URL=http://localhost:5173
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
DNS_SERVERS=8.8.8.8,1.1.1.1
```

For MongoDB Atlas, replace `MONGODB_URI` with the Atlas connection string. URL-encode special password characters. For example, `@` becomes `%40`.

### 2. Configure the frontend

```powershell
cd ..\frontend
Copy-Item .env.example .env
```

Edit `frontend/.env`:

```env
VITE_API_URL=http://localhost:3060
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

The Google client ID must match `GOOGLE_CLIENT_ID` in the backend environment.

### 3. Start the backend

```powershell
cd D:\CyVigilant_cs\backend
npm install
npm run dev
```

The API runs at `http://localhost:3060`.

### 4. Start the frontend

Open a second terminal:

```powershell
cd D:\CyVigilant_cs\frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Choose a display name or sign in with Google, then send a message.

## Google authentication

The frontend uses Google Identity Services. The backend verifies the Google ID token before processing authenticated requests.

In Google Cloud Console:

1. Open **APIs & Services > Credentials**.
2. Create an **OAuth client ID**.
3. Choose **Web application**.
4. Add `http://localhost:5173` under **Authorized JavaScript origins**.
5. Add the production frontend URL when deploying.
6. Put the same client ID in both environment files.

The client secret is not used by this implementation and must not be placed in the frontend.

Name-based conversations use a normalized name as their owner. Anyone using the same name can access that history, so Google sign-in should be used when private history is required.

## API endpoints

All chat endpoints accept either a verified Google bearer token or a `userName` value for name-based conversations.

### `POST /api/chat`

Sends a message to Gemini and stores the user and assistant messages.

```json
{
  "conversationId": "optional-mongodb-id",
  "userName": "required-for-name-based-chat",
  "message": "Where is CyVigilant located?"
}
```

### `GET /api/chat/history`

Returns all conversations belonging to the current identity.

Name-based example:

```text
/api/chat/history?userName=Alex
```

### `GET /api/chat/history/:id`

Returns one conversation after confirming that it belongs to the current identity.

### `DELETE /api/chat/history/:id`

Deletes one conversation belonging to the current identity.

### `GET /api/health`

Returns API and database status:

```json
{
  "status": "ok",
  "database": "connected"
}
```

## Data model

The application uses one MongoDB `conversations` collection. Each conversation contains:

- `userId`: Google account ID or normalized name identifier
- `userEmail`: Google email when available
- `userName`: display name
- `title`: short title generated from the first message
- `messages`: embedded ordered messages
- `createdAt` and `updatedAt`: Mongoose timestamps

Each embedded message contains:

```js
{
  role: "user" | "assistant",
  content: String,
  createdAt: Date
}
```

Embedding messages keeps a conversation ordered and allows the complete thread to be loaded with one query.

## Gemini integration

The backend uses Google's `@google/genai` package and the `gemini-3.6-flash` model by default. The full conversation is converted to Gemini's expected message format before each request.

The support prompt instructs Gemini to be concise, avoid inventing account-specific information, and acknowledge when human support is required. Gemini failures are logged on the server and returned to the frontend as a clear error without saving an incomplete assistant response.

## Production deployment

Deploy the frontend and backend as separate services.

### Backend

- Host: Render, Railway, Fly.io, or a similar Node host
- Root directory: `backend`
- Build command: `npm install`
- Start command: `npm start`

Set these production variables:

```env
GEMINI_API_KEY=your_rotated_gemini_key
GEMINI_MODEL=gemini-3.6-flash
MONGODB_URI=mongodb+srv://user:encoded-password@cluster.mongodb.net/cyvigilant_support?retryWrites=true&w=majority
FRONTEND_URL=https://your-frontend-domain.example
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
PORT=10000
```

### Frontend

- Host: Vercel, Netlify, or a similar static host
- Root directory: `frontend`
- Build command: `npm install && npm run build`
- Publish directory: `dist`

Set these build-time variables:

```env
VITE_API_URL=https://your-backend-domain.example
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

After deployment, verify:

```text
https://your-backend-domain.example/api/health
```

The response should report `"status":"ok"` and `"database":"connected"`. Never commit `.env` files, API keys, database passwords, or Google client secrets.
