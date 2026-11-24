import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useLocation, useNavigate } from 'react-router'
import { useAuth } from '../../../contexts/AuthContext'
import { registerRequestSchema } from '../../../schemas/api'
import { Button } from '../../elements/button/Button'
import styles from './RegisterPage.module.less'
import { Link } from 'react-router'
import z from 'zod'

type FormData = z.infer<typeof registerRequestSchema>

const RegisterPage = () => {
    const { register: registerUser } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const from = location.state?.from?.pathname || '/'

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(registerRequestSchema),
        defaultValues: { login: '', password: '', name: '' }
    })

    const onSubmit = async (data: FormData) => {
        const success = await registerUser(data.login, data.password, data.name)
        if (success) {
            navigate(from, { replace: true })
        }
    }

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>Регистрация</h2>
            <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
                <div className={styles.field}>
                    <label>Имя</label>
                    <input {...register('name')} className={errors.name ? styles.errorInput : ''} disabled={isSubmitting} />
                    {errors.name && <span className={styles.errorText}>{errors.name.message}</span>}
                </div>

                <div className={styles.field}>
                    <label>Логин</label>
                    <input {...register('login')} className={errors.login ? styles.errorInput : ''} disabled={isSubmitting} />
                    {errors.login && <span className={styles.errorText}>{errors.login.message}</span>}
                </div>

                <div className={styles.field}>
                    <label>Пароль</label>
                    <input type="password" {...register('password')} className={errors.password ? styles.errorInput : ''} disabled={isSubmitting} />
                    {errors.password && <span className={styles.errorText}>{errors.password.message}</span>}
                </div>

                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Регистрация...' : 'Создать аккаунт'}
                </Button>

                <p className={styles.switchLink}>
                    Уже есть аккаунт? <Link to="/login">Войти</Link>
                </p>

                <p className={styles.apiSettingsLink}>
                    <Link to="/settings">Настройки подключения</Link>
                </p>
            </form>
        </div>
    )
}

export default RegisterPage