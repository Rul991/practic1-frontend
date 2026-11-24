import styles from './AppLayout.module.less'
import type { PropsWithChildren } from 'react'
import { Link } from 'react-router'

type Props = PropsWithChildren<{
    wide?: boolean
}>

const AppLayout = ({ children, wide = false }: Props) => {
    return (
        <div className={styles.background}>
            <header className={styles.header}>
                <Link to="/" className={styles.logo}>Surveys App</Link>
            </header>
            <main className={styles.content}>
                {wide ? children : <div className={styles.container}>{children}</div>}
            </main>
        </div>
    )
}

export default AppLayout