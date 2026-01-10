//Global in-memory state for active conversation
import { WebSocket } from "ws"

export interface InMemortMessage {
    senderId: string,
    senderRole: string,
    content: string,
    createdAt: string
}

export interface ExtWebSocket extends WebSocket {
    user: { userId: string, role: string }
    rooms: Set<string>
}

//A Collection of WebSocket Connections associated with one conversationId that is known as ROOMID ao they can communicate.
//roomId -> [ws1, ws2, ws3, ws4]
export const rooms = new Map<string, Set<WebSocket>>()


export const conversationMessages: Record<string, InMemortMessage[]> = {} //{ conversationId: [messages]}

export const getMessages = (conversationId: string) => {
    return conversationMessages[conversationId] || []
}

export const addMessages = (conversationId: string, messages: InMemortMessage) => {
    if (!conversationMessages[conversationId]) {
        conversationMessages[conversationId] = []
    }
    conversationMessages[conversationId].push(messages)
}

export const clearMessages = (conversationId: string) => {
    delete conversationMessages[conversationId];
}