import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router'
import { surveyResultsSchema, questionResultSchema } from '../../../schemas/api'
import FetchUtils from '../../../utils/fetch/FetchUtils'
import { Button } from '../../elements/button/Button'
import styles from './SurveyResultsPage.module.less'
import toast from 'react-hot-toast'
import { z } from 'zod'

type Results = z.infer<typeof surveyResultsSchema>
type QuestionResult = z.infer<typeof questionResultSchema>

const SurveyResultsPage = () => {
    const { id } = useParams<{ id: string }>()
    const [results, setResults] = useState<Results | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (!id) return
        loadResults()
    }, [id])

    const loadResults = async () => {
        const result = await FetchUtils.request<Results>({
            path: `surveys/${id}/results`,
            method: 'GET',
            schema: surveyResultsSchema,
        })

        if (result.data) {
            setResults(result.data)
        } else {
            toast.error(result.error?.message || 'Не удалось загрузить результаты')
        }
        setIsLoading(false)
    }

    const renderQuestionResult = (qr: QuestionResult) => {
        const data = qr.data

        if (qr.type === 'single_choice' || qr.type === 'multiple_choice') {
            if (!Array.isArray(data)) return <div className={styles.noData}>Нет данных</div>
            const total = (data as any[]).reduce((sum: number, x: any) => sum + x.count, 0)
            return (
                <div className={styles.choiceStats}>
                    {(data as any[]).map((opt: any) => {
                        const pct = total > 0 ? (opt.count / total) * 100 : 0
                        return (
                            <div key={opt.option_id} className={styles.choiceRow}>
                                <div className={styles.choiceLabel}>
                                    <span>{opt.text}</span>
                                    <span className={styles.choiceCount}>{opt.count} ({pct.toFixed(1)}%)</span>
                                </div>
                                <div className={styles.progressBar}>
                                    <div className={styles.progressFill} style={{ width: `${pct}%` }} />
                                </div>
                            </div>
                        )
                    })}
                </div>
            )
        }

        if (qr.type === 'boolean') {
            const d = data as { true: number; false: number }
            const total = d.true + d.false
            const truePct = total > 0 ? (d.true / total) * 100 : 0
            return (
                <div className={styles.boolStats}>
                    <div className={styles.boolRow}>
                        <span>Да: {d.true}</span>
                        <div className={styles.progressBar}>
                            <div className={styles.progressFill} style={{ width: `${truePct}%` }} />
                        </div>
                        <span>{truePct.toFixed(1)}%</span>
                    </div>
                    <div className={styles.boolRow}>
                        <span>Нет: {d.false}</span>
                        <div className={styles.progressBar}>
                            <div className={styles.progressFill} style={{ width: `${100 - truePct}%` }} />
                        </div>
                        <span>{(100 - truePct).toFixed(1)}%</span>
                    </div>
                </div>
            )
        }

        if (qr.type === 'number') {
            const d = data as { count: number; avg: number | null; min: number | null; max: number | null }
            if (d.count === 0) return <div className={styles.noData}>Нет ответов</div>
            return (
                <div className={styles.numberStats}>
                    <div className={styles.statRow}><span>Ответов:</span><strong>{d.count}</strong></div>
                    <div className={styles.statRow}><span>Среднее:</span><strong>{d.avg?.toFixed(2) ?? '—'}</strong></div>
                    <div className={styles.statRow}><span>Мин:</span><strong>{d.min ?? '—'}</strong></div>
                    <div className={styles.statRow}><span>Макс:</span><strong>{d.max ?? '—'}</strong></div>
                </div>
            )
        }

        if (qr.type === 'text') {
            if (!Array.isArray(data) || data.length === 0) return <div className={styles.noData}>Нет ответов</div>
            return (
                <ul className={styles.textList}>
                    {(data as string[]).map((text, i) => (
                        <li key={i}>{text}</li>
                    ))}
                </ul>
            )
        }

        return <div className={styles.noData}>Нет данных</div>
    }

    if (isLoading) return <div className={styles.loading}>Загрузка...</div>
    if (!results) return <div className={styles.loading}>Результаты не найдены</div>

    return (
        <div className={styles.wrapper}>
            <div className={styles.header}>
                <h1 className={styles.title}>Результаты опроса</h1>
                <Link to="/">
                    <Button>← Назад к списку</Button>
                </Link>
            </div>

            <div className={styles.summary}>
                <span>Всего ответов: <strong>{results.total_responses}</strong></span>
            </div>

            <div className={styles.questions}>
                {results.questions.map((qr) => (
                    <div key={qr.id} className={styles.questionCard}>
                        <h3 className={styles.questionTitle}>{qr.text}</h3>
                        <span className={styles.questionType}>
                            Тип: {qr.type} {qr.type === 'text' ? '(макс. 4096 символов)' : ''}
                        </span>
                        {renderQuestionResult(qr)}
                    </div>
                ))}
            </div>
        </div>
    )
}

export default SurveyResultsPage