import type { ZodType } from "zod"

export default class JsonUtils {
    static parse<T>(value: string, schema: ZodType<T>): T | undefined {
        try {
            const raw = JSON.parse(value)
            const result = schema.parse(raw)
            return result
        }
        catch(e) {
            console.error(
                'JsonUtils.parse | catch',
                e
            )
            return undefined
        }
    }
}