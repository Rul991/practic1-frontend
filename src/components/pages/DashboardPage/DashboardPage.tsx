import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import FetchUtils from '../../../utils/fetch/FetchUtils'
import { surveyListResponseSchema, surveySummaryDtoSchema } from '../../../schemas/api'
import { Button } from '../../elements/button/Button'
import { PageHeader } from '../../common/PageHeader'
import { EmptyState } from '../../common/EmptyState'
import { ConfirmModal } from '../../common/ConfirmModal'
import styles from './DashboardPage.module.less'
import toast from 'react-hot-toast'
import z from 'zod'

type Survey = z.infer<typeof surveySummaryDtoSchema>

const LIMIT = 10

const DashboardPage = () => {
    const navigate = useNavigate()
    const [surveys, setSurveys] = useState<Survey[]>([])
    const [offset, setOffset] = useState(0)
    const [hasMore, setHasMore] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [directLink, setDirectLink] = useState('')
    const [pendingDelete, setPendingDelete] = useState<{ id: number; title: string } | null>(null)

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

    const handleDeleteClick = (id: number, title: string) => {
        setPendingDelete({ id, title })
    }

    const handleDeleteConfirm = async () => {
        if (!pendingDelete) return
        const { id } = pendingDelete
        setPendingDelete(null)

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

    const goToSurvey = (link: string) => navigate(`/s/${link}`)

    const handleGoToLink = () => {
        const raw = directLink.trim()
        if (!raw) return
        const match = raw.match(/\/s\/([^\/?#\s]+)/)
        const link = match ? match[1] : raw
        setDirectLink('')
        navigate(`/s/${link}`)
    }

    const formatDate = (iso: string) => {
        return new Date(iso).toLocaleDateString('ru-RU', {
            day: '2-digit', month: '2-digit', year: 'numeric',
        })
    }

    return (
        <div className={styles.wrapper}>
            <PageHeader
                title="Мои опросы"
                actions={
                    <Link to="/surveys/new">
                        <Button>Создать опрос</Button>
                    </Link>
                }
            />

            <div className={styles.directLink}>
                <input
                    type="text"
                    placeholder={`Вставьте ссылку на опрос, например: ${location.origin}/s/abc123`}
                    value={directLink}
                    onChange={(e) => setDirectLink(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleGoToLink()}
                />
                <Button onClick={handleGoToLink}>Перейти</Button>
            </div>

            {isLoading ? (
                <div className={styles.loading}>Загрузка...</div>
            ) : surveys.length === 0 ? (
                <EmptyState
                    title="У вас пока нет опросов"
                    description="Создайте первый опрос, чтобы начать собирать ответы."
                    action={
                        <Link to="/surveys/new">
                            <Button>Создать первый опрос</Button>
                        </Link>
                    }
                />
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
                                    <div className={styles.linkActions}>
                                        <button
                                            className={styles.linkBtn}
                                            onClick={() => copyLink(survey.link)}
                                            title="Копировать ссылку"
                                        >
                                            Скопировать ссылку
                                        </button>
                                        <button
                                            className={styles.linkBtn}
                                            onClick={() => goToSurvey(survey.link)}
                                            title="Пройти опрос"
                                        >
                                            Пройти опрос
                                        </button>
                                    </div>
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
                                    <Button onClick={() => handleDeleteClick(survey.id, survey.title)}>
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

            <ConfirmModal
                isOpen={!!pendingDelete}
                title="Удалить опрос?"
                message={
                    pendingDelete
                        ? `Опрос "${pendingDelete.title}" и все его ответы будут удалены безвозвратно.`
                        : undefined
                }
                confirmText="Удалить"
                cancelText="Отмена"
                danger
                onConfirm={handleDeleteConfirm}
                onCancel={() => setPendingDelete(null)}
            />
        </div>
    )
}

export default DashboardPage