import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router'
import { Button } from '../../elements/button/Button'
import styles from './SettingsPage.module.less'
import toast from 'react-hot-toast'
import z from 'zod'
import Config from '../../../utils/config/Config'

const settingsFormSchema = z.object({
    baseUrl: z.string().min(1, "Базовый URL не может быть пустым"),
})

type FormData = z.infer<typeof settingsFormSchema>

const SettingsPage = () => {
    const navigate = useNavigate()

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<FormData>({
        resolver: zodResolver(settingsFormSchema),
        defaultValues: {
            baseUrl: Config.get('baseUrl'),
        },
    })

    const onSubmit = async (data: FormData) => {
        try {
            const normalizedUrl = data.baseUrl.trim()
            Config.update({ baseUrl: normalizedUrl })

            toast.success('Настройки сохранены!')

            // Возвращаемся на предыдущую страницу (login/register)
            navigate(-1)
        } catch {
            toast.error('Неверный формат URL. Используйте полный адрес (https://...) или "/"')
        }
    }

    const handleBack = () => {
        navigate(-1)
    }

    return (
        <div className={styles.wrapper}>
            <h1 className={styles.title}>Настройки приложения</h1>

            <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
                <div className={styles.section}>
                    <label className={styles.label}>Базовый URL API</label>
                    <input
                        {...register('baseUrl')}
                        className={errors.baseUrl ? styles.inputError : ''}
                        placeholder="https://api.example.com/ или /"
                    />
                    {errors.baseUrl && (
                        <span className={styles.errorText}>{errors.baseUrl.message}</span>
                    )}
                    <span className={styles.hint}>
                        Укажите адрес, на который будут отправляться все запросы.
                        По умолчанию используется <code>/</code> (текущий домен).
                    </span>
                </div>

                <div className={styles.actions}>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Сохранение...' : 'Сохранить настройки'}
                    </Button>

                    <Button type="button" onClick={handleBack} disabled={isSubmitting}>
                        Назад
                    </Button>
                </div>
            </form>
        </div>
    )
}

export default SettingsPage