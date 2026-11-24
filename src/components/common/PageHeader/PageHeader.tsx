import { ReactNode } from 'react'
import styles from './PageHeader.module.less'

type Props = {
    title: string
    actions?: ReactNode
}

const PageHeader = ({ title, actions }: Props) => {
    return (
        <div className={styles.wrapper}>
            <h1 className={styles.title}>{title}</h1>
            {actions && <div className={styles.actions}>{actions}</div>}
        </div>
    )
}

export default PageHeader