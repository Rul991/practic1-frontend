import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
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
    text_value?: string
    numeric_value?: number
    bool_value?: boolean
}

const PublicSurveyPage = () => {
    const { link } = useParams<{ link: string }>()
    const [survey, setSurvey] = useState<Survey | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [answers, setAnswers] = useState<Record<number, AnswerValue>>({})
    const [errors, setErrors] = useState<Record<number, string>>({})

    useEffect(() => {
        if (!link) return
        loadSurvey()
    }, [link])

    const loadSurvey = async () => {
        const result = await FetchUtils.request<Survey>({
            path: `public/surveys/${link}`,
            method: 'GET',
            schema: surveyDtoSchema,
        })

        if (result.data) {
            setSurvey(result.data)
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

    const updateAnswer = (questionId: number, field: keyof AnswerValue, value: any) => {
        setAnswers((prev) => {
            const updated: AnswerValue = { question_id: questionId }

            if (field === 'option_id') {
                updated.option_id = value
            } else if (field === 'text_value') {
                updated.text_value = value
            } else if (field === 'numeric_value') {
                updated.numeric_value = value
            } else if (field === 'bool_value') {
                updated.bool_value = value
            }

            return { ...prev, [questionId]: updated }
        })

        setErrors((prev) => {
            const newErrors = { ...prev }
            delete newErrors[questionId]
            return newErrors
        })
    }

    const validateAnswers = (): boolean => {
        if (!survey) return false

        const newErrors: Record<number, string> = {}
        let isValid = true

        survey.questions.forEach((q) => {
            const answer = answers[q.id]

            if (q.is_required) {
                const hasValue =
                    answer?.option_id !== undefined ||
                    answer?.text_value !== undefined ||
                    answer?.numeric_value !== undefined ||
                    answer?.bool_value !== undefined

                if (!hasValue) {
                    newErrors[q.id] = 'Этот вопрос обязателен для заполнения'
                    isValid = false
                    return
                }
            }

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
        if (!validateAnswers()) {
            toast.error('Пожалуйста, исправьте ошибки в форме')
            return
        }

        const answersArray = Object.values(answers).filter(
            (a) =>
                a.option_id !== undefined ||
                a.text_value !== undefined ||
                a.numeric_value !== undefined ||
                a.bool_value !== undefined
        )

        const result = await FetchUtils.request<void>({
            path: `public/surveys/${link}/responses`,
            method: 'POST',
            body: { answers: answersArray },
        })

        if (result.error === undefined) {
            toast.success('Ответ отправлен!')
            setIsSubmitted(true)
        } else {
            toast.error(result.error.message)
        }
    }

    if (isLoading) return <div className={styles.loading}>Загрузка опроса...</div>
    if (!survey) return <div className={styles.error}>Опрос не найден или недоступен</div>
    if (isSubmitted) return (
        <div className={styles.success}>
            <h2>Спасибо за участие!</h2>
            <p>Ваш ответ успешно сохранён.</p>
        </div>
    )

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
                    />
                ))}

                <div className={styles.actions}>
                    <Button onClick={handleSubmit}>
                        Отправить ответы
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
}

const QuestionField = ({ question, answer, error, onUpdate }: QuestionFieldProps) => {
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

            {(question.type === 'single_choice' || question.type === 'multiple_choice') && (
                <div className={styles.options}>
                    {question.options.map((opt) => (
                        <label key={opt.id} className={styles.radioLabel}>
                            <input
                                type={question.type === 'single_choice' ? 'radio' : 'checkbox'}
                                checked={answer.option_id === opt.id}
                                onChange={() => {
                                    if (question.type === 'single_choice') {
                                        onUpdate('option_id', opt.id)
                                    } else {
                                        onUpdate('option_id', opt.id)
                                    }
                                }}
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