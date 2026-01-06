import { z } from "zod"

export const SignupSchema = z.object({
    name: z.string().min(3),
    email: z.email(),
    password: z.string().min(6),
    role: z.enum(["admin", "supervisor", "agent", "candidate"]),
    supervisorId: z.string().optional()
})

export const SigninSchema = z.object({
    email: z.email(),
    password: z.string().min(6)
})