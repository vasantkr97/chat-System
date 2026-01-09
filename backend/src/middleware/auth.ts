import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config()

const JWT_SECRET = process.env.JWT_SECRET || "vasanth"


export const authentication = (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization

    if (!header || !header.startsWith("Bearer ")) {
        return res.status(401).json({ success: false, error: "Unauthorized, token missing or invalid"});
    }

    const token = header.split(" ")[1]

    if (!token) {
        return res.status(401).json({ "success": false, "error": "Unauthorized , token missing or invalid"})
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET)

        if (!decoded) {
            return res.status(401).json({ "success": false, "error": "Unauthorized, token missing or invalid"})
        }

        req.user = decoded as { userId: string, role: string }
        next()
    } catch  {
        return res.status(401).json({ "success": false, "error": "Unauthorized, token missing or invalid"})
    }
}

export const authorize = (roles: string[]) => (req: Request, res: Response, next: NextFunction) => {
    const user = req.user

    if (!user || !roles.includes(user.role)) {
        return res.status(403).json({ "success": false, "error": "Forbidden, insufficient permissions"})
    }

    next()
}