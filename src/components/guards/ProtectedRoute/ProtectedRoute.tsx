import { Navigate, useLocation } from 'react-router'
import { useAuth } from '../../../contexts/AuthContext'
import { PropsWithChildren } from 'react'

type ProtectedRouteProps = PropsWithChildren<{
    redirectTo?: string
}>

const ProtectedRoute = ({ children, redirectTo = "/login" }: ProtectedRouteProps) => {
    const { user, isLoading } = useAuth()
    const location = useLocation()

    if (isLoading) {
        return <div className="loading-screen">Загрузка...</div>
    }

    if (!user) {
        return <Navigate to={redirectTo} state={{ from: location }} replace />
    }

    return <>{children}</>
}

export default ProtectedRoute