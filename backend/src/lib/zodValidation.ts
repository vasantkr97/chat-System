import { z } from "zod";

export const signupSchema = z.object({
    name: z.string().min(3),
    email: z.email(),
    password: z.string().min(6),
    role: z.enum(["admin", "supervisor", "candidate", "agent"]),
    supervisorId: z.string().optional()
});

export const loginSchema = z.object({
    email: z.email(),
    password: z.string()
});

