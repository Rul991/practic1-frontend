import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router'
import { responseListResponseSchema, responseListItemSchema } from '../../../schemas/api'
import FetchUtils from '../../../utils/fetch/FetchUtils'
import { Button } from '../../elements/button/Button'
import styles from './ResponsesListPage.module.less'
import toast from 'react-hot-toast'
import z from 'zod'

type ResponseItem = z.infer<typeof responseListItemSchema>

const LIMIT = 20

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
                <div className={styles.header}>
                    <h1 className={styles.title}>Ответы на опрос</h1>
                    <Link to="/">
                        <Button>← Назад к списку</Button>
                    </Link>
                </div>
                <div className={styles.forbidden}>
                    <div className={styles.forbiddenIcon}>🔒</div>
                    <h2 className={styles.forbiddenTitle}>Список ответов недоступен</h2>
                    <p className={styles.forbiddenText}>
                        Этот опрос является анонимным. Данные об авторах ответов не сохраняются,
                        поэтому просмотр списка ответов запрещён.
                    </p>
                    <Link to={`/surveys/${id}/results`}>
                        <Button>Посмотреть статистику</Button>
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className={styles.wrapper}>
            <div className={styles.header}>
                <h1 className={styles.title}>Ответы на опрос</h1>
                <div className={styles.headerActions}>
                    <Link to={`/surveys/${id}/results`}>
                        <Button>Статистика</Button>
                    </Link>
                    <Link to="/">
                        <Button>← Назад</Button>
                    </Link>
                </div>
            </div>

            {responses.length === 0 ? (
                <div className={styles.empty}>
                    <p>Пока нет ни одного ответа</p>
                </div>
            ) : (
                <>
                    <div className={styles.table}>
                        <div className={styles.tableHeader}>
                            <span className={styles.colIndex}>#</span>
                            <span className={styles.colDate}>Дата ответа</span>
                            <span className={styles.colUser}>Пользователь</span>
                        </div>
                        {responses.map((resp, idx) => (
                            <div key={resp.response_id} className={styles.tableRow}>
                                <span className={styles.colIndex}>{offset + idx + 1}</span>
                                <span className={styles.colDate}>{formatDate(resp.created_at)}</span>
                                <span className={styles.colUser}>
                                    {resp.user ? (
                                        <span className={styles.userName}>
                                            {resp.user.name}
                                            <span className={styles.userLogin}>
                                                @{resp.user.login}
                                            </span>
                                        </span>
                                    ) : (
                                        <span className={styles.anonymous}>Анонимно</span>
                                    )}
                                </span>
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