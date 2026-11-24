import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useParams, useNavigate } from 'react-router'
import { updateSurveyRequestSchema, surveyDtoSchema } from '../../../schemas/api'
import FetchUtils from '../../../utils/fetch/FetchUtils'
import { Button } from '../../elements/button/Button'
import styles from './SurveyEditPage.module.less'
import toast from 'react-hot-toast'
import z from 'zod'

type FormData = z.infer<typeof updateSurveyRequestSchema>

const SurveyEditPage = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [isLoading, setIsLoading] = useState(true)

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<FormData>({
        resolver: zodResolver(updateSurveyRequestSchema),
    })

    useEffect(() => {
        if (!id) return
        loadSurvey()
    }, [id])

    const loadSurvey = async () => {
        const result = await FetchUtils.request({
            path: `surveys/${id}`,
            method: 'GET',
            schema: surveyDtoSchema,
        })

        if (result.data) {
            reset({
                title: result.data.title,
                description: result.data.description,
                is_anonymous: result.data.is_anonymous,
                only_one_response: result.data.only_one_response,
            })
        } else {
            toast.error(result.error?.message || 'Не удалось загрузить опрос')
            navigate('/')
        }
        setIsLoading(false)
    }

    const onSubmit = async (data: FormData) => {
        const result = await FetchUtils.request<void>({
            path: `surveys/${id}`,
            method: 'PATCH',
            body: data,
        })

        if (result.error === undefined) {
            toast.success('Опрос обновлён')
            navigate('/')
        } else {
            toast.error(result.error.message)
        }
    }

    if (isLoading) return <div className={styles.loading}>Загрузка...</div>

    return (
        <div className={styles.wrapper}>
            <h1 className={styles.title}>Редактирование опроса</h1>

            <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
                <div className={styles.section}>
                    <label className={styles.label}>Название *</label>
                    <input
                        {...register('title')}
                        className={errors.title ? styles.inputError : ''}
                    />
                    {errors.title && <span className={styles.errorText}>{errors.title.message}</span>}
                </div>

                <div className={styles.section}>
                    <label className={styles.label}>Описание</label>
                    <textarea {...register('description')} rows={3} />
                </div>

                <div className={styles.flags}>
                    <label className={styles.checkbox}>
                        <input type="checkbox" {...register('is_anonymous')} disabled={true} />
                        <span>Анонимный опрос</span>
                    </label>
                    <label className={styles.checkbox}>
                        <input type="checkbox" {...register('only_one_response')} />
                        <span>Только один ответ от пользователя</span>
                    </label>
                </div>

                <div className={styles.actions}>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Сохранение...' : 'Сохранить'}
                    </Button>
                </div>
            </form>
        </div>
    )
}

export default SurveyEditPage