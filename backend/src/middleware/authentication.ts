import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { prisma } from "../db";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "vasanth";

export const authentication = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ success: false, error: "Unauthorized, token missing or invalid" })
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({ success: false, error: "Unauthorized, token missing or invalid" })
        }

        const decodedToken = jwt.verify(token, JWT_SECRET) as { userId: string } 

        const user = await prisma.user.findUnique({
            where: {
                id: decodedToken.userId
            }
        })

        if (!user) {
            return res.status(401).json({ success: false, error: "Unauthorized, token missing or invalid" })
        }

        req.user = { id: user.id, name: user.name, email: user.email, role: user.role }
        next()
    } catch (error) {
        console.error("Error in middleware...!", error)
        return res.status(401).json({ success: false, error: "Unauthorized, token missing or invalid" })
    }
}