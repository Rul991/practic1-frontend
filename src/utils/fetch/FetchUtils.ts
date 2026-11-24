import type { ZodType } from "zod"
import Config from "../config/Config"
import { errorBodySchema } from "../../schemas/api"

export type ApiError = {
    code: string
    message: string
    status: number
}

export type FetchResult<T> =
    | { data: T; error?: undefined }
    | { data?: undefined; error: ApiError }

type FetchOptions<T> = {
    path: string
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT'
    body?: any
    schema?: ZodType<T>
}

export default class FetchUtils {
    private static _getBaseUrl(): string {
        return Config.get('baseUrl')
    }

    private static _getUrl(path: string): URL {
        const base = this._getBaseUrl()
        const cleanPath = path.replace(/^\//, '')
        const origin = base.startsWith('http') ? base : window.location.origin

        return new URL(`/api/v1/${cleanPath}`, origin)
    }

    static async request<T>({ path, method = 'GET', body, schema }: FetchOptions<T>): Promise<FetchResult<T>> {
        const token = Config.get('authorizationToken')
        const url = this._getUrl(path)

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        }

        if (token) {
            headers['Authorization'] = `Bearer ${token}`
        }

        try {
            const response = await fetch(url, {
                method,
                headers,
                body: body ? JSON.stringify(body) : undefined,
            })

            const rawJson = await response.json().catch(() => ({}))

            if (!response.ok) {
                const parsedError = errorBodySchema.safeParse(rawJson)
                return {
                    error: {
                        code: parsedError.success ? parsedError.data.error.code : 'UNKNOWN',
                        message: parsedError.success ? parsedError.data.error.message : 'Неизвестная ошибка сервера',
                        status: response.status,
                    }
                }
            }

            if (schema) {
                const parsedData = schema.parse(rawJson)
                return { data: parsedData }
            }

            return { data: rawJson as T }
        } catch (e) {
            return {
                error: {
                    code: 'NETWORK_ERROR',
                    message: e instanceof Error ? e.message : 'Ошибка сети',
                    status: 0,
                }
            }
        }
    }
}