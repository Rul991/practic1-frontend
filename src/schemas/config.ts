import z, { literal, string, url } from "zod"

export const configSchema = z.object({
    baseUrl: url().or(literal('/')).default('/'),
    authorizationToken: string().optional()
})