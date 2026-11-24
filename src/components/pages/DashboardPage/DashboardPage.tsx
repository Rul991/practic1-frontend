import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../../../contexts/AuthContext'
import FetchUtils from '../../../utils/fetch/FetchUtils'
import { surveyListResponseSchema, surveySummaryDtoSchema } from '../../../schemas/api'
import { Button } from '../../elements/button/Button'
import styles from './DashboardPage.module.less'
import toast from 'react-hot-toast'
import z from 'zod'

type Survey = z.infer<typeof surveySummaryDtoSchema>

const LIMIT = 10

const DashboardPage = () => {
    const { } = useAuth()
    const [surveys, setSurveys] = useState<Survey[]>([])
    const [offset, setOffset] = useState(0)
    const [hasMore, setHasMore] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    const loadSurveys = async (currentOffset: number) => {
        setIsLoading(true)
        const result = await FetchUtils.request({
            path: `surveys?limit=${LIMIT}&offset=${currentOffset}`,
            method: 'GET',
            schema: surveyListResponseSchema,
        })

        if (result.data) {
            setSurveys(result.data.items)
            setHasMore(result.data.items.length === LIMIT)
        } else {
            toast.error(result.error?.message || 'Не удалось загрузить опросы')
        }
        setIsLoading(false)
    }

    useEffect(() => {
        loadSurveys(offset)
    }, [offset])

    const handleDelete = async (id: number, title: string) => {
        if (!confirm(`Удалить опрос "${title}"?`)) return

        const result = await FetchUtils.request<void>({
            path: `surveys/${id}`,
            method: 'DELETE',
        })

        if (result.error === undefined) {
            toast.success('Опрос удалён')
            loadSurveys(offset)
        } else {
            toast.error(result.error.message)
        }
    }

    const copyLink = (link: string) => {
        const fullUrl = `${window.location.origin}/s/${link}`
        navigator.clipboard.writeText(fullUrl)
        toast.success('Ссылка скопирована!')
    }

    const formatDate = (iso: string) => {
        return new Date(iso).toLocaleDateString('ru-RU', {
            day: '2-digit', month: '2-digit', year: 'numeric',
        })
    }

    return (
        <div className={styles.wrapper}>
            <div className={styles.header}>
                <h1 className={styles.title}>Мои опросы</h1>
                <Link to="/surveys/new">
                    <Button>Создать опрос</Button>
                </Link>
            </div>

            {isLoading ? (
                <div className={styles.loading}>Загрузка...</div>
            ) : surveys.length === 0 ? (
                <div className={styles.empty}>
                    <p>У вас пока нет опросов</p>
                    <Link to="/surveys/new">
                        <Button>Создать первый опрос</Button>
                    </Link>
                </div>
            ) : (
                <>
                    <div className={styles.list}>
                        {surveys.map((survey) => (
                            <div key={survey.id} className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <h3 className={styles.cardTitle}>{survey.title}</h3>
                                    <span className={styles.responses}>
                                        {survey.response_count} ответов
                                    </span>
                                </div>
                                <div className={styles.cardMeta}>
                                    <span>Создан: {formatDate(survey.created_at)}</span>
                                    <button
                                        className={styles.linkBtn}
                                        onClick={() => copyLink(survey.link)}
                                        title="Копировать ссылку"
                                    >
                                        Скопировать ссылку
                                    </button>
                                </div>
                                <div className={styles.cardActions}>
                                    <Link to={`/surveys/${survey.id}/responses`}>
                                        <Button>Ответы</Button>
                                    </Link>
                                    <Link to={`/surveys/${survey.id}/results`}>
                                        <Button>Результаты</Button>
                                    </Link>
                                    <Link to={`/surveys/${survey.id}/edit`}>
                                        <Button>Редактировать</Button>
                                    </Link>
                                    <Button onClick={() => handleDelete(survey.id, survey.title)}>
                                        Удалить
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className={styles.pagination}>
                        <Button
                            onClick={() => setOffset(Math.max(0, offset - LIMIT))}
                            disabled={offset === 0}
                        >
                            ← Назад
                        </Button>
                        <span className={styles.pageInfo}>Страница {Math.floor(offset / LIMIT) + 1}</span>
                        <Button
                            onClick={() => setOffset(offset + LIMIT)}
                            disabled={!hasMore}
                        >
                            Вперёд →
                        </Button>
                    </div>
                </>
            )}
        </div>
    )
}

export default DashboardPage