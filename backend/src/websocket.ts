import { WebSocketServer } from "ws";
import { Server } from "http";
import jwt from "jsonwebtoken"
import dotenv from "dotenv";
import { addMessages, conversationMessages, getMessages, rooms, type ExtWebSocket } from "./lib/inmemoryStore";
import prisma from "./lib/db";
import { string } from "zod";
import { use } from "react";
dotenv.config()

const JWT_SECRET = process.env.JWT_SECRET || "vasanth"


export const setupWebSocketServer = (server: Server) => {
    const wss = new WebSocketServer({ server, path: '/ws'})

    wss.on("connection", async (ws: ExtWebSocket, req) => {
        //1. Auth Handshake
        if (!req.url || !req.headers.host) {
            ws.close();
            return;
        }
        const url = new URL(req.url, `http://${req.headers.host}`);
        const token = url.searchParams.get('token');

        if (!token) {
            if (ws.readyState === 1) {
                ws.send(JSON.stringify({ "ERROR": "Unauthorized or invalid token"}))
            }
            return ws.close()
        }

        try {
            const decoded = jwt.verify(token, JWT_SECRET)
            if (typeof decoded === "string") {
                ws.close()
                return
            }
            ws.user = { userId: decoded.userId, role: decoded.role } 
            ws.rooms = new Set()

        } catch {
            if (ws.readyState === 1) {
                ws.send(JSON.stringify({ "event": "ERROR", "data": { "message": "Unauthorized or Invalid token"}}))
            }
            ws.close()
        }

        //2. Event listenes
        ws.on('message', async (rawMessage) => {
            try {
                const { event, data } = JSON.parse(rawMessage.toString())
                await handleEvent(ws, event, data)
            } catch {
                if (ws.readyState === ws.OPEN) {
                    ws.send(JSON.stringify({ "event": "ERROR", "data": { "message": "Invalid message format" }}))
                }
            }
        })
    })
}


async function handleEvent(ws: ExtWebSocket,event: string, data: any) {
    switch (event) {
        case "JOINED_CONVERSATION":
            await handleJoinConversationEvent(ws, data);
            break;
        case "SEND_MESSAGE":
            await handleSendMessageEvent(ws, data);
            break;
        case "LEAVE_CONVERSATION":
            await handleLeaveConversation(ws, data);
            break;
        case "CLOSE_CONVERSATION":
            await handleCloseConversation(ws, data);
            break;
        default:
            if (ws.readyState == ws.OPEN) {
                ws.send(JSON.stringify({ "event": "ERROR", "data": { "message": "Unknown event"}}));
            }
    }
}


const handleJoinConversationEvent = async (ws: ExtWebSocket, data: any) => {
    const { conversationId } = data
    const roomId = `conversation:<conversationId>`
    const { userId, role } = ws.user

    const convo = await prisma.conversation.findFirst({
        where: {
            id: conversationId
        }
    })

    if (!convo) {
        if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify({ "event": "ERROR" , "data": { "message": "conversation not found" }}))
        }
        return;
    }

    if (convo.status === "closed") {
        if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify({ "event": "ERROR", "data": { "message": "Conversation already closed"}}))
        }
    }

    if (role === "candidate") {
        if (convo.candidateId !== userId) {
            if (ws.readyState === ws.OPEN) {
                ws.send(JSON.stringify({ "event": "ERROR", "data": { "message": "Not allowed to access this conversation" }}))
            }
        }  
    }

    if (role === "agent") {
        if (convo.agentId !== userId) {
            if (ws.readyState === ws.OPEN) {
                ws.send(JSON.stringify({ "event": "ERROR", "data": { "message": "Not allowed to access this conversation" }}))
            }
        }
    }

    if (convo.status === "open") {
        await prisma.conversation.update({
            where: { id: conversationId },
            data: { status: "assigned" }
        })
    } else {
        if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify({ "event": "ERROR", "data": { "message": "Forbidden for this role"}}))
        }
    }

    if (!rooms.get(roomId)) rooms.set(roomId, new Set())

    rooms.get(roomId)?.add(ws)
    //adding metadata that room this socket joined
    ws.rooms.add(roomId)

    if (!getMessages(conversationId).length) {
        if (!conversationMessages[conversationId]) {
            conversationMessages[conversationId] = []
        }
    }

    if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ 
            "event": "JOINED_CONVERSATION",
            "data": {
                "conversationId": conversationId,
                "status": role === "agent" ? "assigned" : convo.status
            }
        }))
    }
};



const handleSendMessageEvent = async(ws: ExtWebSocket, data: any) => {
    const { conversationId, content } = data
    const { userId, role } = ws.user
    const roomId = ws.rooms

}

const handleLeaveConversation = async (ws: ExtWebSocket, data: any) => {

}

const handleCloseConversation = async (ws: ExtWebSocket, data: any) => {

}