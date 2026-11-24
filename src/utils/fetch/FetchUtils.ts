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
        const baseUrlObj = new URL(base, location.origin)
        const basePath = baseUrlObj.pathname.replace(/\/+$/, '')

        const hashIdx = path.indexOf('#')
        const hash = hashIdx >= 0 ? path.slice(hashIdx) : ''
        const beforeHash = hashIdx >= 0 ? path.slice(0, hashIdx) : path

        const queryIdx = beforeHash.indexOf('?')
        const query = queryIdx >= 0 ? beforeHash.slice(queryIdx) : ''
        const pathOnly = queryIdx >= 0 ? beforeHash.slice(0, queryIdx) : beforeHash

        const cleanPath = pathOnly.replace(/^\/+/, '')

        baseUrlObj.pathname = `${basePath}/api/v1/${cleanPath}`
        if (query) baseUrlObj.search = query
        if (hash) baseUrlObj.hash = hash

        return baseUrlObj
    }

    /** Превращает код ошибки в понятный пользователю текст */
    private static _getErrorMessage(code: string, serverMessage: string): string {
        // Для ошибок валидации важнее именно серверное сообщение
        if (code === 'VALIDATION_FAILED' && serverMessage) {
            return serverMessage
        }

        const messages: Record<string, string> = {
            VALIDATION_FAILED: 'Проверьте правильность заполнения данных.',
            UNAUTHORIZED: serverMessage || 'Требуется авторизация. Войдите в систему заново.',
            FORBIDDEN: serverMessage || 'У вас нет прав для выполнения этого действия.',
            NOT_FOUND: serverMessage || 'Запрашиваемый ресурс не найден.',
            CONFLICT: serverMessage || 'Конфликт данных. Возможно, действие уже выполнено.',
            DB_ERROR: 'Ошибка базы данных. Попробуйте позже.',
            INTERNAL: 'Внутренняя ошибка сервера. Попробуйте позже.',
            NETWORK_ERROR: 'Ошибка сети. Проверьте подключение к интернету и настройки в разделе «Настройки подключения».',
            UNKNOWN: serverMessage || 'Произошла неизвестная ошибка.',
        }

        return messages[code] ?? serverMessage ?? 'Произошла ошибка.'
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
                const code = parsedError.success ? parsedError.data.error.code : 'UNKNOWN'
                const serverMessage = parsedError.success
                    ? parsedError.data.error.message
                    : 'Неизвестная ошибка сервера'

                return {
                    error: {
                        code,
                        message: this._getErrorMessage(code, serverMessage),
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
                    code: 'INVALID_RESPONSE',
                    message: 'Сервер вернул неожиданный формат ответа.',
                    status: 200,
                }
            }
        }
    }
}