import { useEffect } from 'react'
import { Button } from '../../elements/button/Button'
import styles from './ConfirmModal.module.less'

type Props = {
    isOpen: boolean
    title: string
    message?: string
    confirmText?: string
    cancelText?: string
    danger?: boolean
    onConfirm: () => void
    onCancel: () => void
}

const ConfirmModal = ({
    isOpen,
    title,
    message,
    confirmText = 'Подтвердить',
    cancelText = 'Отмена',
    danger = false,
    onConfirm,
    onCancel,
}: Props) => {
    useEffect(() => {
        if (!isOpen) return
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onCancel()
        }
        document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
    }, [isOpen, onCancel])

    useEffect(() => {
        if (!isOpen) return
        const prev = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => { document.body.style.overflow = prev }
    }, [isOpen])

    if (!isOpen) return null

    return (
        <div className={styles.overlay} onClick={onCancel}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <h3 className={styles.title}>{title}</h3>
                {message && <p className={styles.message}>{message}</p>}
                <div className={styles.actions}>
                    <Button type="button" onClick={onCancel}>
                        {cancelText}
                    </Button>
                    <button
                        type="button"
                        className={`${styles.confirmBtn} ${danger ? styles.danger : ''}`}
                        onClick={onConfirm}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ConfirmModal