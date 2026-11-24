import { createContext, useContext, useState, useEffect, PropsWithChildren } from 'react'
import { userDtoSchema, loginResponseSchema, registerResponseSchema } from '../schemas/api'
import FetchUtils from '../utils/fetch/FetchUtils'
import Config from '../utils/config/Config'
import toast from 'react-hot-toast'
import z from 'zod'

type User = z.infer<typeof userDtoSchema>

type AuthContextType = {
    user: User | null
    isLoading: boolean
    login: (login: string, password: string) => Promise<boolean>
    register: (login: string, password: string, name: string) => Promise<boolean>
    logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: PropsWithChildren) => {
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        checkAuth()
    }, [])

    const checkAuth = async () => {
        const token = Config.get('authorizationToken')
        if (!token) {
            setIsLoading(false)
            return
        }

        const result = await FetchUtils.request<User>({
            path: 'auth/me',
            method: 'GET',
            schema: userDtoSchema,
        })

        if (result.data) {
            setUser(result.data)
        } 
        else {
            Config.set('authorizationToken', '')
        }
        setIsLoading(false)
    }

    const login = async (login: string, password: string): Promise<boolean> => {
        const result = await FetchUtils.request({
            path: 'auth/login',
            method: 'POST',
            body: { login, password },
            schema: loginResponseSchema,
        })

        if (result.data) {
            Config.set('authorizationToken', result.data.token)
            await checkAuth()
            toast.success('Добро пожаловать!')
            return true
        } else {
            toast.error(result.error?.message || 'Ошибка входа')
            return false
        }
    }

    const register = async (login: string, password: string, name: string): Promise<boolean> => {
        const result = await FetchUtils.request({
            path: 'auth/register',
            method: 'POST',
            body: { login, password, name },
            schema: registerResponseSchema, 
        })

        if (result.data) {
            Config.set('authorizationToken', result.data.token)
            await checkAuth()
            toast.success('Регистрация успешна!')
            return true
        } else {
            toast.error(result.error?.message || 'Ошибка регистрации')
            return false
        }
    }

    const logout = () => {
        Config.set('authorizationToken', '')
        setUser(null)
        toast('Вы вышли из системы')
    }

    return (
        <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) throw new Error('useAuth must be used within AuthProvider')
    return context
}