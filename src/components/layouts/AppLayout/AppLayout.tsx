import styles from './AppLayout.module.less'
import type { PropsWithChildren } from 'react'

type Props = PropsWithChildren<{

}>

const AppLayout = ({
    children
}: Props) => {
    return (
        <div className={styles.background}>
            <div className={styles.container}>
                {children}
            </div>
        </div>
    )
}

export default AppLayout
