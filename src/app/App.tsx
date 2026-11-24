import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from "react-router"
import { AppLayout } from "../components/layouts/AppLayout"
import { DashboardLayout } from "../components/layouts/DashboardLayout/DashboardLayout"
import { ProtectedRoute } from "../components/guards/ProtectedRoute"
import { AuthProvider } from "../contexts/AuthContext"
import { Toaster } from "react-hot-toast"

const LoginPage = lazy(() => import("../components/pages/LoginPage/LoginPage"))
const RegisterPage = lazy(() => import("../components/pages/RegisterPage/RegisterPage"))
const DashboardPage = lazy(() => import("../components/pages/DashboardPage/DashboardPage"))
const SurveyBuilderPage = lazy(() => import("../components/pages/SurveyBuilderPage/SurveyBuilderPage"))
const SurveyEditPage = lazy(() => import("../components/pages/SurveyEditPage/SurveyEditPage"))
const SurveyResultsPage = lazy(() => import("../components/pages/SurveyResultsPage/SurveyResultsPage"))
const PublicSurveyPage = lazy(() => import("../components/pages/PublicSurveyPage/PublicSurveyPage"))
const ResponsesListPage = lazy(() => import("../components/pages/ResponsesListPage/ResponsesListPage"))
const SettingsPage = lazy(() => import("../components/pages/SettingsPage/SettingsPage"))

const PageFallback = () => (
    <div
        style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            color: '#B0B8C1',
            fontSize: '1.1rem',
        }}
    >
        Загрузка...
    </div>
)

const App = () => {
    return (
        <AuthProvider>
            <Toaster
                position="top-right"
                toastOptions={{
                    style: {
                        background: '#1A1D21',
                        color: '#FFFFFF',
                        border: '1px solid #FFB085',
                    },
                }}
            />
            <Suspense fallback={<PageFallback />}>
                <Routes>
                    <Route path="/login" element={<AppLayout><LoginPage /></AppLayout>} />
                    <Route path="/register" element={<AppLayout><RegisterPage /></AppLayout>} />

                    <Route path="/s/:link" element={
                        <ProtectedRoute redirectTo="/register">
                            <AppLayout wide>
                                <PublicSurveyPage />
                            </AppLayout>
                        </ProtectedRoute>
                    } />

                    <Route path="/" element={
                        <ProtectedRoute>
                            <DashboardLayout>
                                <DashboardPage />
                            </DashboardLayout>
                        </ProtectedRoute>
                    } />

                    <Route path="/surveys/:id/responses" element={
                        <ProtectedRoute>
                            <DashboardLayout>
                                <ResponsesListPage />
                            </DashboardLayout>
                        </ProtectedRoute>
                    } />

                    <Route path="/surveys/new" element={
                        <ProtectedRoute>
                            <DashboardLayout>
                                <SurveyBuilderPage />
                            </DashboardLayout>
                        </ProtectedRoute>
                    } />

                    <Route path="/surveys/:id/edit" element={
                        <ProtectedRoute>
                            <DashboardLayout>
                                <SurveyEditPage />
                            </DashboardLayout>
                        </ProtectedRoute>
                    } />

                    <Route path="/surveys/:id/results" element={
                        <ProtectedRoute>
                            <DashboardLayout>
                                <SurveyResultsPage />
                            </DashboardLayout>
                        </ProtectedRoute>
                    } />

                    <Route path="/settings" element={
                        <AppLayout>
                            <SettingsPage />
                        </AppLayout>
                    } />

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Suspense>
        </AuthProvider>
    )
}

export default App