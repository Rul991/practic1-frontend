import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useLocation } from 'react-router'
import { useAuth } from '../../../contexts/AuthContext'
import { loginRequestSchema } from '../../../schemas/api'
import { Button } from '../../elements/button/Button'
import styles from './LoginPage.module.less'
import { Link } from 'react-router'
import z from 'zod'

type FormData = z.infer<typeof loginRequestSchema>

const LoginPage = () => {
    const { login } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    
    const from = (location.state as any)?.from?.pathname || '/'

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(loginRequestSchema),
        defaultValues: { login: '', password: '' }
    })

    const onSubmit = async (data: FormData) => {
        const success = await login(data.login, data.password)
        if (success) {
            navigate(from, { replace: true })
        }
    }

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>Вход в систему</h2>
            <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
                <div className={styles.field}>
                    <label>Логин</label>
                    <input 
                        {...register('login')} 
                        className={errors.login ? styles.errorInput : ''}
                        disabled={isSubmitting}
                    />
                    {errors.login && <span className={styles.errorText}>{errors.login.message}</span>}
                </div>

                <div className={styles.field}>
                    <label>Пароль</label>
                    <input 
                        type="password" 
                        {...register('password')} 
                        className={errors.password ? styles.errorInput : ''}
                        disabled={isSubmitting}
                    />
                    {errors.password && <span className={styles.errorText}>{errors.password.message}</span>}
                </div>

                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Вход...' : 'Войти'}
                </Button>

                <p className={styles.switchLink}>
                    Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
                </p>

                <p className={styles.apiSettingsLink}>
                    <Link to="/settings">Настройки подключения</Link>
                </p>
            </form>
        </div>
    )
}

export default LoginPage