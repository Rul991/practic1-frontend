import { PropsWithChildren } from 'react'
import styles from './Button.module.less'

type Props = PropsWithChildren<{
    onClick?: () => void
    type?: "submit" | "reset" | "button" | undefined
    disabled?: boolean
}>

const Button = ({
    children,
    onClick,
    type,
    disabled
}: Props) => {
    return (
        <button disabled={disabled} type={type} className={styles.container} onClick={onClick}>
            {children}
        </button>
    )
}

export default Button
