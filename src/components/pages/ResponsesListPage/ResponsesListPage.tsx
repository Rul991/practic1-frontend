import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router'
import {
    responseListResponseSchema,
    responseListItemSchema,
    answerDetailSchema,
} from '../../../schemas/api'
import FetchUtils from '../../../utils/fetch/FetchUtils'
import { Button } from '../../elements/button/Button'
import { PageHeader } from '../../common/PageHeader'
import { EmptyState } from '../../common/EmptyState'
import styles from './ResponsesListPage.module.less'
import toast from 'react-hot-toast'
import z from 'zod'

type ResponseItem = z.infer<typeof responseListItemSchema>
type AnswerDetail = z.infer<typeof answerDetailSchema>

const LIMIT = 20

const getQuestionLabel = (a: AnswerDetail) =>
    a.question_text || `Вопрос #${a.question_id}`

const formatAnswer = (a: AnswerDetail): string => {
    if (a.option_text !== undefined && a.option_text !== null) return a.option_text
    if (a.text_value !== undefined && a.text_value !== null) return a.text_value
    if (a.numeric_value !== undefined && a.numeric_value !== null) return String(a.numeric_value)
    if (a.bool_value !== undefined && a.bool_value !== null) return a.bool_value ? 'Да' : 'Нет'
    if (a.option_id !== undefined) return `Вариант #${a.option_id}`
    return '—'
}

const ResponsesListPage = () => {
    const { id } = useParams<{ id: string }>()
    const [responses, setResponses] = useState<ResponseItem[]>([])
    const [offset, setOffset] = useState(0)
    const [hasMore, setHasMore] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [isForbidden, setIsForbidden] = useState(false)

    const loadResponses = async (currentOffset: number) => {
        setIsLoading(true)
        setIsForbidden(false)

        const result = await FetchUtils.request({
            path: `surveys/${id}/responses?limit=${LIMIT}&offset=${currentOffset}`,
            method: 'GET',
            schema: responseListResponseSchema,
        })

        if (result.data) {
            setResponses(result.data.items)
            setHasMore(result.data.items.length === LIMIT)
        } else if (result.error?.code === 'FORBIDDEN') {
            setIsForbidden(true)
            toast.error('Этот опрос анонимный — список ответов недоступен')
        } else if (result.error?.code === 'NOT_FOUND') {
            toast.error('Опрос не найден')
        } else {
            toast.error(result.error?.message || 'Не удалось загрузить ответы')
        }
        setIsLoading(false)
    }

    useEffect(() => {
        if (!id) return
        loadResponses(offset)
    }, [id, offset])

    const formatDate = (iso: string) => {
        return new Date(iso).toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    if (isLoading) {
        return <div className={styles.loading}>Загрузка ответов...</div>
    }

    if (isForbidden) {
        return (
            <div className={styles.wrapper}>
                <PageHeader
                    title="Ответы на опрос"
                    actions={
                        <Link to="/">
                            <Button>← Назад к списку</Button>
                        </Link>
                    }
                />
                <EmptyState
                    icon="🔒"
                    title="Список ответов недоступен"
                    description="Этот опрос является анонимным. Данные об авторах ответов не сохраняются, поэтому просмотр списка ответов запрещён."
                    action={
                        <Link to={`/surveys/${id}/results`}>
                            <Button>Посмотреть статистику</Button>
                        </Link>
                    }
                />
            </div>
        )
    }

    return (
        <div className={styles.wrapper}>
            <PageHeader
                title="Ответы на опрос"
                actions={
                    <>
                        <Link to={`/surveys/${id}/results`}>
                            <Button>Статистика</Button>
                        </Link>
                        <Link to="/">
                            <Button>← Назад</Button>
                        </Link>
                    </>
                }
            />

            {responses.length === 0 ? (
                <EmptyState title="Пока нет ни одного ответа" />
            ) : (
                <>
                    <div className={styles.list}>
                        {responses.map((resp, idx) => (
                            <div key={resp.response_id} className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <span className={styles.cardIndex}>#{offset + idx + 1}</span>
                                    <span className={styles.cardDate}>
                                        {formatDate(resp.created_at)}
                                    </span>
                                    <span className={styles.cardUser}>
                                        {resp.user ? (
                                            <>
                                                {resp.user.name}{' '}
                                                <span className={styles.userLogin}>
                                                    @{resp.user.login}
                                                </span>
                                            </>
                                        ) : (
                                            <span className={styles.anonymous}>Анонимно</span>
                                        )}
                                    </span>
                                </div>

                                {resp.answers && resp.answers.length > 0 && (
                                    <div className={styles.answers}>
                                        {resp.answers.map((a, i) => (
                                            <div key={i} className={styles.answerRow}>
                                                <span className={styles.answerQuestion}>
                                                    {getQuestionLabel(a)}
                                                </span>
                                                <span className={styles.answerValue}>
                                                    {formatAnswer(a)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
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
                        <span className={styles.pageInfo}>
                            Страница {Math.floor(offset / LIMIT) + 1}
                        </span>
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

export default ResponsesListPage