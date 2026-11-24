import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import App from './App'
import { ErrorBoundary } from '../components/common/ErrorBoundary'
import "@styles/index.less"

createRoot(document.getElementById('root')!).render(
    <ErrorBoundary>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </ErrorBoundary>
)