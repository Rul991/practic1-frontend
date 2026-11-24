import { PropsWithChildren } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import { Button } from '../../elements/button/Button'
import styles from './DashboardLayout.module.less'
import { Link } from 'react-router'

export const DashboardLayout = ({ children }: PropsWithChildren) => {
    const { user, logout } = useAuth()

    return (
        <div className={styles.wrapper}>
            <header className={styles.header}>
                <Link to={'/'} className={styles.logo}>Surveys App</Link>
                <div className={styles.userInfo}>
                    <span>{user?.name || `@${user?.login || ''}`}</span>
                    <Button onClick={logout}>Выйти</Button>
                </div>
            </header>
            <main className={styles.content}>
                {children}
            </main>
        </div>
    )
}