import { Routes, Route, Navigate } from "react-router"
import { AppLayout } from "../components/layouts/AppLayout"
import { DashboardLayout } from "../components/layouts/DashboardLayout/DashboardLayout"
import { ProtectedRoute } from "../components/guards/ProtectedRoute"
import LoginPage from "../components/pages/LoginPage/LoginPage"
import RegisterPage from "../components/pages/RegisterPage/RegisterPage"
import DashboardPage from "../components/pages/DashboardPage/DashboardPage"
import SurveyBuilderPage from "../components/pages/SurveyBuilderPage/SurveyBuilderPage"
import SurveyEditPage from "../components/pages/SurveyEditPage/SurveyEditPage"
import SurveyResultsPage from "../components/pages/SurveyResultsPage/SurveyResultsPage"
import PublicSurveyPage from "../components/pages/PublicSurveyPage/PublicSurveyPage"
import ResponsesListPage from "../components/pages/ResponsesListPage/ResponsesListPage"
import { AuthProvider } from "../contexts/AuthContext"
import { Toaster } from "react-hot-toast"
import { SettingsPage } from "../components/pages/SettingsPage"

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
            <Routes>
                <Route path="/login" element={<AppLayout><LoginPage /></AppLayout>} />
                <Route path="/register" element={<AppLayout><RegisterPage /></AppLayout>} />

                <Route path="/s/:link" element={
                    <ProtectedRoute redirectTo="/register">
                        <PublicSurveyPage />
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
        </AuthProvider>
    )
}

export default App