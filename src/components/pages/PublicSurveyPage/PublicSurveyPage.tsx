import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router'
import { surveyDtoSchema } from '../../../schemas/api'
import FetchUtils from '../../../utils/fetch/FetchUtils'
import { Button } from '../../elements/button/Button'
import styles from './PublicSurveyPage.module.less'
import toast from 'react-hot-toast'
import type { z } from 'zod'

type Survey = z.infer<typeof surveyDtoSchema>
type Question = Survey['questions'][number]

type AnswerValue = {
    question_id: number
    option_id?: number
    option_ids?: number[]
    text_value?: string
    numeric_value?: number
    bool_value?: boolean
}

type SubmitAnswer = {
    question_id: number
    option_id?: number
    text_value?: string
    numeric_value?: number
    bool_value?: boolean
}

const RESPONDED_PREFIX = 'survey_responded:'

const wasResponded = (link: string) => {
    try {
        return localStorage.getItem(RESPONDED_PREFIX + link) === 'true'
    } catch {
        return false
    }
}

const markResponded = (link: string) => {
    try {
        localStorage.setItem(RESPONDED_PREFIX + link, 'true')
    } catch { }
}

const PublicSurveyPage = () => {
    const { link } = useParams<{ link: string }>()
    const navigate = useNavigate()
    const [survey, setSurvey] = useState<Survey | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [answers, setAnswers] = useState<Record<number, AnswerValue>>({})
    const [errors, setErrors] = useState<Record<number, string>>({})
    const [blockedReason, setBlockedReason] = useState<string | null>(null)
    const [isSending, setIsSending] = useState(false)

    useEffect(() => {
        if (!link) return
        loadSurvey(link)
    }, [link])

    const loadSurvey = async (surveyLink: string) => {
        const result = await FetchUtils.request<Survey>({
            path: `public/surveys/${surveyLink}`,
            method: 'GET',
            schema: surveyDtoSchema,
        })

        if (result.data) {
            setSurvey(result.data)

            if (result.data.only_one_response && wasResponded(surveyLink)) {
                setBlockedReason('Вы уже проходили этот опрос. Повторное прохождение невозможно.')
            }

            const initialAnswers: Record<number, AnswerValue> = {}
            result.data.questions.forEach((q) => {
                initialAnswers[q.id] = { question_id: q.id }
            })
            setAnswers(initialAnswers)
        } else {
            toast.error(result.error?.message || 'Опрос не найден')
        }
        setIsLoading(false)
    }

    const clearError = (questionId: number) => {
        setErrors((prev) => {
            const newErrors = { ...prev }
            delete newErrors[questionId]
            return newErrors
        })
    }

    const updateAnswer = (questionId: number, field: keyof AnswerValue, value: any) => {
        setAnswers((prev) => {
            const updated: AnswerValue = { question_id: questionId }

            if (field === 'option_id') updated.option_id = value
            else if (field === 'option_ids') updated.option_ids = value
            else if (field === 'text_value') updated.text_value = value
            else if (field === 'numeric_value') updated.numeric_value = value
            else if (field === 'bool_value') updated.bool_value = value

            return { ...prev, [questionId]: updated }
        })
        clearError(questionId)
    }

    const toggleOption = (questionId: number, optionId: number) => {
        setAnswers((prev) => {
            const current = prev[questionId]
            const ids = current?.option_ids ?? []
            const nextIds = ids.includes(optionId)
                ? ids.filter((id) => id !== optionId)
                : [...ids, optionId]
            return {
                ...prev,
                [questionId]: { question_id: questionId, option_ids: nextIds },
            }
        })
        clearError(questionId)
    }

    const hasAnyValue = (a: AnswerValue | undefined) =>
        !!a &&
        (a.option_id !== undefined ||
            (a.option_ids !== undefined && a.option_ids.length > 0) ||
            a.text_value !== undefined ||
            a.numeric_value !== undefined ||
            a.bool_value !== undefined)

    const validateAnswers = (): boolean => {
        if (!survey) return false

        const newErrors: Record<number, string> = {}
        let isValid = true

        survey.questions.forEach((q) => {
            const answer = answers[q.id]

            if (q.is_required && !hasAnyValue(answer)) {
                newErrors[q.id] = 'Этот вопрос обязателен для заполнения'
                isValid = false
                return
            }

            if (q.type === 'multiple_choice') return

            const valueCount = [
                answer?.option_id,
                answer?.text_value,
                answer?.numeric_value,
                answer?.bool_value,
            ].filter((v) => v !== undefined).length

            if (valueCount > 1) {
                newErrors[q.id] = 'Можно указать только одно значение'
                isValid = false
            }
        })

        setErrors(newErrors)
        return isValid
    }

    const handleSubmit = async () => {
        if (!link) return
        if (!validateAnswers()) {
            toast.error('Пожалуйста, исправьте ошибки в форме')
            return
        }

        const answersArray: SubmitAnswer[] = []

        Object.values(answers).forEach((a) => {
            if (a.option_ids && a.option_ids.length > 0) {
                a.option_ids.forEach((optId) => {
                    answersArray.push({ question_id: a.question_id, option_id: optId })
                })
            } else if (
                a.option_id !== undefined ||
                a.text_value !== undefined ||
                a.numeric_value !== undefined ||
                a.bool_value !== undefined
            ) {
                answersArray.push({
                    question_id: a.question_id,
                    option_id: a.option_id,
                    text_value: a.text_value,
                    numeric_value: a.numeric_value,
                    bool_value: a.bool_value,
                })
            }
        })

        setIsSending(true)
        const result = await FetchUtils.request<void>({
            path: `public/surveys/${link}/responses`,
            method: 'POST',
            body: { answers: answersArray },
        })
        setIsSending(false)

        if (result.error === undefined) {
            toast.success('Ответ отправлен!')
            if (survey?.only_one_response) markResponded(link)
            setIsSubmitted(true)
        } else if (result.error.code === 'CONFLICT') {
            markResponded(link)
            setBlockedReason(
                result.error.message || 'Вы уже проходили этот опрос. Повторное прохождение невозможно.'
            )
        } else {
            toast.error(result.error.message)
        }
    }

    if (isLoading) {
        return (
            <div className={styles.wrapper}>
                <div className={styles.loading}>Загрузка опроса...</div>
            </div>
        )
    }

    if (!survey) {
        return (
            <div className={styles.wrapper}>
                <div className={styles.error}>Опрос не найден или недоступен</div>
            </div>
        )
    }

    if (blockedReason) {
        return (
            <div className={styles.wrapper}>
                <div className={styles.blocked}>
                    <div className={styles.blockedIcon}>🚫</div>
                    <h2 className={styles.blockedTitle}>Опрос недоступен</h2>
                    <p className={styles.blockedText}>{blockedReason}</p>
                    <div className={styles.blockedActions}>
                        <Button onClick={() => navigate(-1)}>← Назад</Button>
                    </div>
                </div>
            </div>
        )
    }

    if (isSubmitted) {
        return (
            <div className={styles.wrapper}>
                <div className={styles.success}>
                    <h2>Спасибо за участие!</h2>
                    <p>Ваш ответ успешно сохранён.</p>
                    <div className={styles.successActions}>
                        <Link to="/">
                            <Button>На главную</Button>
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className={styles.wrapper}>
            <div className={styles.header}>
                <h1 className={styles.title}>{survey.title}</h1>
                {survey.description && <p className={styles.description}>{survey.description}</p>}
            </div>

            <div className={styles.form}>
                {survey.questions.map((q) => (
                    <QuestionField
                        key={q.id}
                        question={q}
                        answer={answers[q.id]}
                        error={errors[q.id]}
                        onUpdate={(field, value) => updateAnswer(q.id, field, value)}
                        onToggleOption={(optId) => toggleOption(q.id, optId)}
                    />
                ))}

                <div className={styles.actions}>
                    <Button onClick={handleSubmit} disabled={isSending}>
                        {isSending ? 'Отправка...' : 'Отправить ответы'}
                    </Button>
                </div>
            </div>
        </div>
    )
}

type QuestionFieldProps = {
    question: Question
    answer: AnswerValue
    error?: string
    onUpdate: (field: keyof AnswerValue, value: any) => void
    onToggleOption: (optionId: number) => void
}

const QuestionField = ({ question, answer, error, onUpdate, onToggleOption }: QuestionFieldProps) => {
    const selectedIds = answer?.option_ids ?? []

    return (
        <div className={styles.questionCard}>
            <h3 className={styles.questionTitle}>
                {question.text}
                {question.is_required && <span className={styles.required}> *</span>}
            </h3>

            {question.type === 'text' && (
                <textarea
                    value={answer.text_value || ''}
                    onChange={(e) => onUpdate('text_value', e.target.value)}
                    rows={3}
                    placeholder="Ваш ответ"
                    className={error ? styles.inputError : ''}
                    maxLength={4096}
                />
            )}

            {question.type === 'number' && (
                <input
                    type="number"
                    value={answer.numeric_value ?? ''}
                    onChange={(e) => {
                        const val = e.target.value === '' ? undefined : Number(e.target.value)
                        onUpdate('numeric_value', val)
                    }}
                    placeholder="Число"
                    className={error ? styles.inputError : ''}
                />
            )}

            {question.type === 'boolean' && (
                <div className={styles.boolOptions}>
                    <label className={styles.radioLabel}>
                        <input
                            type="radio"
                            checked={answer.bool_value === true}
                            onChange={() => onUpdate('bool_value', true)}
                        />
                        <span>Да</span>
                    </label>
                    <label className={styles.radioLabel}>
                        <input
                            type="radio"
                            checked={answer.bool_value === false}
                            onChange={() => onUpdate('bool_value', false)}
                        />
                        <span>Нет</span>
                    </label>
                </div>
            )}

            {question.type === 'single_choice' && (
                <div className={styles.options}>
                    {question.options.map((opt) => (
                        <label key={opt.id} className={styles.radioLabel}>
                            <input
                                type="radio"
                                checked={answer.option_id === opt.id}
                                onChange={() => onUpdate('option_id', opt.id)}
                            />
                            <span>{opt.text}</span>
                        </label>
                    ))}
                </div>
            )}

            {question.type === 'multiple_choice' && (
                <div className={styles.options}>
                    {question.options.map((opt) => (
                        <label key={opt.id} className={styles.radioLabel}>
                            <input
                                type="checkbox"
                                checked={selectedIds.includes(opt.id)}
                                onChange={() => onToggleOption(opt.id)}
                            />
                            <span>{opt.text}</span>
                        </label>
                    ))}
                </div>
            )}

            {error && <span className={styles.errorText}>{error}</span>}
        </div>
    )
}

export default PublicSurveyPage