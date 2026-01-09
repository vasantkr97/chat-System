import type { Request, Response} from "express"
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"
import { loginSchema, signupSchema } from "../lib/zodValidation";
import prisma from "../lib/db";
import dotenv from "dotenv";
dotenv.config()

const JWT_SECRET = process.env.JWT_SECRET || "vasanth";


export const signup =async (req: Request, res: Response) => {
    const result = signupSchema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({ "success": false, "error": "Invalid request schema"})
    }

    const { name, email, password, role, supervisorId } = result.data

    if (role === "agent" && !supervisorId) {
        return res.status(400).json({ "success": false, "error": "Invalid request schema"})
    }

    if (supervisorId) {
        const supervisor = await prisma.user.findUnique({
            where: { id: supervisorId }
        });

        if (!supervisor) {
            return res.status(404).json({ "success": false, "error": "Supervisor not found" });
        }

        if (supervisor.role !== "supervisor") {
            return res.status(400).json({ "success": false, "error": "Invalid supervisor role" });
        }
    }

    try {
        const existing = await prisma.user.findFirst({
            where: {
                email
            }
        })
        
        if (existing) {
            return res.status(409).json({ "success": false, "error": "Email already exists"});
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role,
                supervisorId
            }
        })

        const token = jwt.sign({ userId: newUser.id, role: newUser.role }, JWT_SECRET)

        res.cookie("jwt", token,  {
            httpOnly: true,
            secure:false,
            maxAge: 7*24*60*60*1000
        })

        return res.status(201).json({
            "success": true,
            "data": {
                "_id": newUser.id,
                "name": newUser.name,
                "email": newUser.email,
                "role": newUser.role
            }
        })
    } catch (error) {
        console.error("error in signing up..!")
        return res.status(500).json({ success: false, error: "Error in signing up..!"})
    }
}


export const signin = async (req: Request, res: Response) => {
    const result = loginSchema.safeParse(req.body)

    if (!result.success) {
        return res.status(400).json({ "success": false, "error": "Invalid request schema"})
    }

    try {
        const { email, password } = result.data

        const user = await prisma.user.findFirst({
            where: {
                email
            }
        })

        if (!user) {
            return res.status(401).json({ "success":false, "error": "Unauthorized, token missing or invalid"})
        }

        const isMatching  = await bcrypt.compare(password, user.password);
        
        if (!isMatching) {
            return res.status(401).json({ "success": false, "error": "Unauthorized, token missing or invalid"})
        }

        const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET);

        res.cookie("jwt", token,  {
            httpOnly: true,
            secure: false,
            maxAge: 7*24*60*60*1000
        }) 

        return res.status(200).json({
            "success": true,
            "data": {
                "token": token
            }
        })
    } catch (error) {
        console.error("error in signing in...!");
        return res.status(500).json({ "success": false, "error": "error in signing in...!"})
    }
}

export const getMe = async (req: Request, res: Response) => {
    const user = await prisma.user.findFirst({
        where: {
            id: req.user?.userId
        }
    })

    return res.status(200).json({
        "success": true,
        "data": {
            "_id": user?.id,
            "name": user?.name,
            "email": user?.email,
            "role": user?.role
        }
    })
}

