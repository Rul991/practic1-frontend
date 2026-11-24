import { ReactNode } from 'react'
import styles from './EmptyState.module.less'

type Props = {
    icon?: ReactNode
    title: string
    description?: string
    action?: ReactNode
}

const EmptyState = ({ icon, title, description, action }: Props) => {
    return (
        <div className={styles.wrapper}>
            {icon && <div className={styles.icon}>{icon}</div>}
            <h3 className={styles.title}>{title}</h3>
            {description && <p className={styles.description}>{description}</p>}
            {action && <div className={styles.action}>{action}</div>}
        </div>
    )
}

export default EmptyState