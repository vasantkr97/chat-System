import type { Request, Response } from "express"
import prisma from "../lib/db"

//Only Admin
export const getAnalytics = async (req: Request, res: Response) => {
    const supervisors = await prisma.user.findMany({
        where: {
            role: "supervisor"
        },
        select: { id: true, name: true }
    })

    const getAnalytics = await Promise.all(supervisors.map( async (sup) => {
        //get agents counts for each supervisor
        const agentsCount = await prisma.user.count({
            where: { supervisorId: sup.id}
        })

        //count closed conversations where agents belong to this supervisor
        
        const closedConvCount = await prisma.conversation.count({
            where: {
                status: "closed",
                agent: {
                    supervisorId: sup.id
                }
            }
        });

        return {
            "supervisorId": sup.id,
            "supervisorName": sup.name,
            "agents": agentsCount,
            "conversationsHandled": closedConvCount 
        }
    }));

    return res.status(200).json({ 
        "success": true,
        "data": getAnalytics
     })
}