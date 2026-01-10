import type { Request, Response } from "express";
import prisma from "../lib/db";
import { clearMessages, getMessages, type InMemortMessage } from "../lib/inmemoryStore";


//Candidate
export const createConversation = async (req: Request, res: Response) => {
    const { supervisorId } = req.body;

    if (!supervisorId) {
        return res.status(400).json({ msg: "Invalid request schema" })
    }

    const candidateId = req.user.userId

    //check for active conversation

    const activeConversation = await prisma.conversation.findFirst({
        where: {
            candidateId,
            status: { in: ['open', 'assigned'] }
        }
    })

    if (activeConversation) {
        return res.status(409).json({ "success": false, "error": "Candidate already has an active conversation" })
    }

    const supervisor = await prisma.user.findUnique({
        where: {
            id: supervisorId,
            role: "supervisor"
        }
    });

    if (!supervisor) {
        return res.status(404).json({ "success": false, "error": "Supervisor not found" })
    }

    try {
        const conversation = await prisma.conversation.create({
            data: {
                candidateId,
                supervisorId,
                status: "open"
            }
        })

        return res.status(201).json({
            "success": true,
            "data": {
                "_id": conversation.id,
                "status": "open",
                "supervisorId": "s100"
            }
        })
    } catch (error: any) {
        return res.status(500).json({ "success": false, "error": error.message })
    }

}

//Supervisor
export const assignAgent = async (req: Request, res: Response) => {
    const conversationId = req.params.id
    const { agentId } = req.body
    const supervisorId = req.user.userId

    try {
        const agent = await prisma.user.findFirst({
            where: {
                id: agentId
            }
        })

        if (!agent) {
            return res.status(404).json({ "success": false, "error": "Agent not found" })
        }

        if (agent.supervisorId !== supervisorId) {
            return res.status(403).json({ "success": false, "error": "Agent doesn't belong to you" });
        }

        const conversation = await prisma.conversation.findFirst({
            where: {
                id: conversationId
            }
        })

        if (!conversation) {
            return res.status(404).json({ "success": false, "error": "Conversation not found" })
        }

        if (conversation.status === "closed") {
            return res.status(403).json({ "success": false, "error": "cannot assign agent to closed conversation" })
        }

        const updated = await prisma.conversation.update({
            where: {
                id: conversationId
            },
            data: {
                agentId: agentId
            }
        })

        return res.status(200).json({
            "success": true,
            "data": {
                "conversationId": updated.id,
                "agentId": agentId,
                "supervisorId": supervisorId
            }
        })
    } catch (error: any) {
        return res.status(500).json({ "success": false, error: error.message })
    }
}

//admin Or candidate
export const getConversation = async (req: Request, res: Response) => {
    const { conversationId } = req.body;
    const { userId, role } = req.user;

    try {
        const conversation = await prisma.conversation.findFirst({
            where: {
                id: conversationId,
            }
        })

        if (!conversation) {
            return res.status(404).json({ "success": false, "error": "Conversation not found" })
        }

        //access rules 
        if (role !== "admin") {
            const isParticipant =
                conversation.candidateId === userId ||
                conversation.agentId === userId ||
                conversation.supervisorId === userId

            if (!isParticipant) {
                return res.status(403).json({ "success": false, "error": "Forbidden, insufficient permissions" })
            }
        }

        let messages: InMemortMessage[] = []

        if (conversation.status === "assigned") {
            messages = getMessages(conversation.id)
        } else if (conversation.status === "closed") {
            const dbmessages = await prisma.message.findMany({
                where: { conversationId }
            })
            messages = dbmessages.map(msg => ({
                ...msg,
                createdAt: msg.createdAt.toString()
            }))
        }

        return res.status(200).json({
            "success": true,
            "data": {
                "_id": conversationId,
                "status": conversation.status,
                "agentId": conversation.agentId,
                "supervisorId": conversation.supervisorId,
                "candidateId": conversation.candidateId,
                "messages": messages
            }
        })
    } catch (error: any) {
        return res.status(500).json({ "success": false, "error": error.message })
    }
}


export const closeConversation = async (req: Request, res: Response) => {
    const conversationId = req.params.id

    if (!conversationId) {
        return res.status(400).json({ "success": false, 'error': "Invalid request schema" })
    }

    try {
        const conversation = await prisma.conversation.findFirst({
            where: { id: conversationId }
        })

        if (!conversation) {
            return res.status(404).json({ "success": false, "error": "Conversation not found" })
        }

        if (conversation.status !== "open") {
            return res.status(400).json({ "success": false, "error": "Conversation status mismatch (Must be open)" })
        }

        const updated = await prisma.conversation.update({
            where: { id: conversationId },
            data: { status: "closed" }
        })

        clearMessages(conversationId);

        return res.status(200).json({
            "success": true, "data": {
                "conversationId": conversation.id,
                "status": updated.status
            }
        })

    } catch (error) {
        return res.status(500).json({ "success": false, "error": "internal server error" })
    }
}
