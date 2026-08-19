import "dotenv/config";
import dotenv from "dotenv";
import dns from "node:dns";
import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import { GoogleGenAI } from "@google/genai";
import { OAuth2Client } from "google-auth-library";

// ============================================================
// ENVIRONMENT
// ============================================================

dotenv.config({ path: new URL("../.env", import.meta.url) });


// ============================================================
// DNS CONFIGURATION
// ============================================================

const dnsServers = (process.env.DNS_SERVERS || "8.8.8.8,1.1.1.1")
    .split(",")
    .map((server) => server.trim())
    .filter(Boolean);

dns.setServers(dnsServers);


// ============================================================
// APPLICATION CONFIGURATION
// ============================================================

const app = express();

const port = Number(process.env.PORT) || 3060;

const mongoUri =
    process.env.MONGODB_URI ||
    "mongodb://127.0.0.1:27017/cyvigilant_support";

const allowedOrigins =
    process.env.FRONTEND_URL
        ? [process.env.FRONTEND_URL]
        : true;

const googleClientId =
    process.env.GOOGLE_CLIENT_ID || "";


// ============================================================
// EXTERNAL SERVICES
// ============================================================

const googleClient = new OAuth2Client(googleClientId);

const ai = process.env.GEMINI_API_KEY
    ? new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY
    })
    : null;


// ============================================================
// MONGOOSE SCHEMAS
// ============================================================

const messageSchema = new mongoose.Schema(
    {
        role: {
            type: String,
            enum: ["user", "assistant"],
            required: true
        },

        content: {
            type: String,
            required: true,
            trim: true
        },

        createdAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        _id: false
    }
);


const conversationSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
            index: true
        },

        userEmail: {
            type: String,
            required: false,
            default: "",
            trim: true
        },

        userName: {
            type: String,
            required: true,
            trim: true,
            maxlength: 80
        },

        messages: {
            type: [messageSchema],
            default: []
        },

        title: {
            type: String,
            default: "New support conversation",
            maxlength: 120
        }
    },
    {
        timestamps: true
    }
);


const Conversation =
    mongoose.model("Conversation", conversationSchema);


// ============================================================
// MIDDLEWARES
// ============================================================

app.use(
    cors({
        origin: allowedOrigins
    })
);

app.use(
    express.json({
        limit: "20kb"
    })
);


// ============================================================
// GOOGLE AUTHENTICATION MIDDLEWARE
// ============================================================

async function resolveIdentity(req, res, next) {
    const authorization =
        req.headers.authorization || "";

    const token =
        authorization.startsWith("Bearer ")
            ? authorization.slice(7)
            : "";

    try {
        if (token && googleClientId) {
            const ticket = await googleClient.verifyIdToken({ idToken: token, audience: googleClientId });
            const payload = ticket.getPayload();
            req.user = { id: `google:${payload.sub}`, email: payload.email, name: payload.name || payload.email };
        } else {
            const name = typeof (req.body?.userName || req.query?.userName) === "string"
                ? (req.body?.userName || req.query?.userName).trim()
                : "";
            if (!name || name.length > 80) return res.status(400).json({ error: "Please provide a name up to 80 characters." });
            req.user = { id: `name:${name.toLowerCase()}`, email: "", name };
        }

        next();
    } catch (error) {
        console.error(
            "Google authentication failed:",
            error.message
        );

        res.status(401).json({
            error: "Your Google session is invalid or expired. Please sign in again."
        });
    }
}


// ============================================================
// VALIDATION / UTILITY FUNCTIONS
// ============================================================

function validateChatBody(body) {
    const conversationId = typeof body.conversationId === "string" ? body.conversationId.trim() : "";
    const userName = typeof body.userName === "string" ? body.userName.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (conversationId && !mongoose.isValidObjectId(conversationId)) return "Invalid conversation.";
    if (!userName || userName.length > 80) return "Please provide a name up to 80 characters.";
    if (!message || message.length > 2000) return "Please provide a message up to 2,000 characters.";
    return { conversationId, userName, message };
}

function formatConversation(messages) {
    return messages.map(({ role, content }) => ({
        role: role === "assistant" ? "model" : "user",
        parts: [{ text: content }]
    }));
}


// ============================================================
// HEALTH ROUTE
// ============================================================

app.get("/api/health", (_req, res) => {
    res.json({
        status: "ok",
        database:
            mongoose.connection.readyState === 1
                ? "connected"
                : "disconnected"
    });
});


// ============================================================
// CHAT ROUTES
// ============================================================

app.post(
    "/api/chat",
    resolveIdentity,
    async (req, res) => {
        const input =
            validateChatBody(req.body || {});

        if (typeof input === "string") {
            return res.status(400).json({
                error: input
            });
        }

        if (!ai) {
            return res.status(503).json({
                error:
                    "The AI service is not configured. Add GEMINI_API_KEY to the backend environment."
            });
        }

        if (
            mongoose.connection.readyState !== 1
        ) {
            return res.status(503).json({
                error:
                    "The database is unavailable. Start MongoDB and try again."
            });
        }

        try {
            let conversation =
                input.conversationId
                    ? await Conversation.findOne({
                        _id: input.conversationId,
                        userId: req.user.id
                    })
                    : null;

            if (!conversation) {
                conversation =
                    new Conversation({
                        userId: req.user.id,
                        userEmail: req.user.email,
                        userName: req.user.email ? req.user.name : input.userName,
                        title:
                            input.message.slice(0, 60)
                    });
            }

            conversation.messages.push({
                role: "user",
                content: input.message
            });

            const response =
                await ai.models.generateContent({
                    model:
                        process.env.GEMINI_MODEL ||
                        "gemini-3.6-flash",

                    contents:
                        formatConversation(
                            conversation.messages
                        ),

                    config: {
                        systemInstruction:
                            "You are CyVigilant's friendly customer support assistant. Give concise, accurate, practical help. Never invent account-specific information. If you do not know something, say so and suggest contacting a human agent.",

                        temperature: 0.4
                    }
                });

            const assistantMessage =
                response.text?.trim();

            if (!assistantMessage) {
                throw new Error(
                    "Gemini returned an empty response"
                );
            }

            conversation.messages.push({
                role: "assistant",
                content: assistantMessage
            });

            await conversation.save();

            res.json({
                conversationId:
                    conversation.id,

                message: {
                    role: "assistant",
                    content: assistantMessage,
                    createdAt: new Date()
                }
            });

        } catch (error) {
            console.error(
                "Chat request failed:",
                error.message
            );

            res.status(502).json({
                error:
                    "The support assistant is temporarily unavailable. Please try again."
            });
        }
    }
);


// ============================================================
// CHAT HISTORY ROUTES
// ============================================================

app.get("/api/chat/history", resolveIdentity, async (req, res) => {
        if (
            mongoose.connection.readyState !== 1
        ) {
            return res.status(503).json({
                error:
                    "The database is unavailable."
            });
        }

        try {
            const conversations =
                await Conversation.find({
                    userId: req.user.id
                })
                    .select(
                        "userName title createdAt updatedAt messages"
                    )
                    .sort({
                        updatedAt: -1
                    })
                    .lean();

            res.json({
                conversations
            });

        } catch (error) {
            console.error(
                "History request failed:",
                error.message
            );

            res.status(500).json({
                error:
                    "Unable to load chat history."
            });
        }
    }
);


app.get(
    "/api/chat/history/:id",
    resolveIdentity,
    async (req, res) => {
        if (
            !mongoose.isValidObjectId(
                req.params.id
            )
        ) {
            return res.status(400).json({
                error:
                    "Invalid conversation."
            });
        }

        try {
            const conversation =
                await Conversation.findOne({
                    _id: req.params.id,
                    userId: req.user.id
                }).lean();

            if (!conversation) {
                return res.status(404).json({
                    error:
                        "Conversation not found."
                });
            }

            res.json({
                conversation
            });

        } catch (error) {
            console.error(
                "Conversation request failed:",
                error.message
            );

            res.status(500).json({
                error:
                    "Unable to load this conversation."
            });
        }
    }
);


app.delete(
    "/api/chat/history/:id",
    resolveIdentity,
    async (req, res) => {
        if (
            !mongoose.isValidObjectId(
                req.params.id
            )
        ) {
            return res.status(400).json({
                error:
                    "Invalid conversation."
            });
        }

        try {
            const result =
                await Conversation.deleteOne({
                    _id: req.params.id,
                    userId: req.user.id
                });

            if (!result.deletedCount) {
                return res.status(404).json({
                    error:
                        "Conversation not found."
                });
            }

            res.json({
                deleted: true
            });

        } catch (error) {
            console.error(
                "Conversation deletion failed:",
                error.message
            );

            res.status(500).json({
                error:
                    "Unable to delete this conversation."
            });
        }
    }
);


// DATABASE CONNECTION & SERVER STARTUP

mongoose
    .connect(mongoUri)
    .then(() => {
        app.listen(
            port,
            () => {
                console.log(
                    `backend working on port :${port}`
                );
            }
        );
    })
    .catch((error) => {
        console.error(
            `MongoDB connection failed: ${error.message}`
        );
    });