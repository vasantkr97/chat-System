import type { Request, Response} from "express"
import { prisma } from "../db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"
import dotenv from "dotenv";
import { SigninSchema, SignupSchema } from "../types/zod.user";
import { ZodError } from "zod";
import { clearScreenDown } from "readline";
dotenv.config()

const JWT_SECRET = process.env.JWT_SECRET || "vasanth";


export const signup = async (req: Request, res: Response) =>{
    try {
        const { name, email, password, role, supervisorId } = SignupSchema.parse(req.body);

        if (role === "agent" && !supervisorId) {
            return res.status(400).json({ success: false, error: "Invalid request schema"})
        }

        const existingUser = await prisma.user.findFirst({
            where: { email }
        })

        if (existingUser) {
            return res.status(409).json({ success: false, error: "Email already exists"})
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const user = await prisma.user.create({
            data: {
                name, 
                email,
                password: hashedPassword,
                role,
                supervisorId
            }
        })

        const token = jwt.sign({ userId: user.id, role: user.role}, JWT_SECRET);

        res.cookie("jwt", token, {
            httpOnly: true,
            secure: false,
            maxAge: 7*24*60*60*1000
        })

        return res.status(201).json({
            success: true,
            data: {
                _id: user.id,
                name: user.name, 
                email: user.email,
                role: user.role
            }
        })
    } catch (error) {
        if (error instanceof ZodError) {
            console.error("Validation error", error);
            return res.status(400).json({ success: false, error: "Invalid request schema"})
        }
        console.error("Internal server error", error);
        return res.status(500).json({ success: false, error: "Internal server error"})
    }
}

export const signin = async (req: Request, res: Response) => {
    try {
        const { email, password } = SigninSchema.parse(req.body);

        const existingUser = await prisma.user.findFirst({
            where: {
                email
            }
        })

        if (!existingUser) {
            return res.status(401).json({ success: false, error: "Unauthorized, token missing or invalid"})
        }

        const validatePassword = await bcrypt.compare(password, existingUser.password)

        if (!validatePassword) {
            return res.status(401).json({ success: false, error: "Unauthorized, token missing or invalid"})
        }

        const token = jwt.sign({ userId: existingUser.id, role: existingUser.role}, JWT_SECRET)

        res.cookie('jwt', token, {
            httpOnly: true,
            secure: false,
            maxAge: 7*24*60*60*1000
        })

        return res.status(200).json({
            success: true,
            data: {
                token: token
            }
        })

    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({ success: false, error: "Invalid request schema" })
        }
        return res.status(500).json({
            success: false,
            error: "Internal server error"
        })
    }
};

export const getMe = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, error: "Unauthorized, token missing or invalid"})
        }

        const { id, name, email, role } = req.user;

        return res.status(200).json({
            "success": true,
            "data": {
                "_id": id,
                "name": name,
                "email": email,
                "role": role
            }
        })

    }  catch (error) {
        console.error("some error in get me...!");
        return res.status(500).json({
            success: false,
            error: "Internal server error"
        })
    }
}

