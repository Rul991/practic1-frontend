import { Component, ErrorInfo, ReactNode } from 'react'
import styles from './ErrorBoundary.module.less'

type Props = { children: ReactNode }
type State = { hasError: boolean; error?: Error }

class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error('ErrorBoundary caught:', error, info)
    }

    handleReload = () => window.location.reload()
    handleGoHome = () => { window.location.href = '/' }

    render() {
        if (this.state.hasError) {
            return (
                <div className={styles.wrapper}>
                    <div className={styles.card}>
                        <div className={styles.icon}>💥</div>
                        <h1 className={styles.title}>Что-то пошло не так</h1>
                        <p className={styles.message}>
                            Произошла непредвиденная ошибка. Попробуйте перезагрузить страницу.
                        </p>
                        {this.state.error && (
                            <pre className={styles.details}>{this.state.error.message}</pre>
                        )}
                        <div className={styles.actions}>
                            <button type="button" className={styles.primary} onClick={this.handleReload}>
                                Перезагрузить
                            </button>
                            <button type="button" className={styles.secondary} onClick={this.handleGoHome}>
                                На главную
                            </button>
                        </div>
                    </div>
                </div>
            )
        }
        return this.props.children
    }
}

export default ErrorBoundary