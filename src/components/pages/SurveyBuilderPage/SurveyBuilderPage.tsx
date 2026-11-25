import { useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router'
import { createSurveyRequestSchema } from '../../../schemas/api'
import FetchUtils from '../../../utils/fetch/FetchUtils'
import { Button } from '../../elements/button/Button'
import styles from './SurveyBuilderPage.module.less'
import toast from 'react-hot-toast'
import z from 'zod'
import { PageHeader } from '../../common/PageHeader'
import LinkUtils from '../../../utils/string/LinkUtils'

type FormData = z.infer<typeof createSurveyRequestSchema>

const QUESTION_TYPES = [
    { value: 'single_choice', label: 'Один вариант' },
    { value: 'multiple_choice', label: 'Несколько вариантов' },
    { value: 'text', label: 'Текст' },
    { value: 'number', label: 'Число' },
    { value: 'boolean', label: 'Да/Нет' },
] as const

const isChoiceType = (type: string) =>
    type === 'single_choice' || type === 'multiple_choice'

const SurveyBuilderPage = () => {
    const navigate = useNavigate()

    const {
        register,
        control,
        handleSubmit,
        watch,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(createSurveyRequestSchema),
        defaultValues: {
            title: '',
            description: '',
            is_anonymous: false,
            only_one_response: false,
            questions: [],
        },
    })

    const { fields: questionFields, append: appendQuestion, remove: removeQuestion } = useFieldArray({
        control,
        name: 'questions',
    })

    const onSubmit = async (data: FormData) => {
        const cleanedData = {
            ...data,
            questions: data.questions.map((q) => ({
                ...q,
                options: isChoiceType(q.type) ? q.options : [],
            })),
        }

        const result = await FetchUtils.request<{ link?: string }>({
            path: 'surveys',
            method: 'POST',
            body: cleanedData,
        })

        if (result.error === undefined) {
            const link = result.data?.link
            if (link) {
                const fullUrl = LinkUtils.getShowable(link)
                try {
                    await navigator.clipboard.writeText(fullUrl)
                    toast.success('Опрос создан! Ссылка скопирована в буфер обмена.')
                } catch {
                    toast.success('Опрос создан! Не удалось скопировать ссылку автоматически.')
                }
            } else {
                toast.success('Опрос создан!')
            }
            navigate('/')
        } else {
            toast.error(result.error.message)
        }
    }

    const addQuestion = () => {
        const maxPos = questionFields.reduce((m, f) => Math.max(m, f.position ?? 0), -1)
        appendQuestion({
            text: '',
            type: 'single_choice',
            is_required: false,
            position: maxPos + 1,
            options: [{ text: '', position: 0 }],
        })
    }

    return (
        <div className={styles.wrapper}>
            <PageHeader title="Создание опроса" />

            <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
                <div className={styles.section}>
                    <label className={styles.label}>Название *</label>
                    <input
                        {...register('title')}
                        className={errors.title ? styles.inputError : ''}
                        placeholder="Например: Опрос удовлетворённости"
                    />
                    {errors.title && <span className={styles.errorText}>{errors.title.message}</span>}
                </div>

                <div className={styles.section}>
                    <label className={styles.label}>Описание</label>
                    <textarea
                        {...register('description')}
                        rows={3}
                        placeholder="Необязательно"
                    />
                </div>

                <div className={styles.flags}>
                    <label className={styles.checkbox}>
                        <input type="checkbox" {...register('is_anonymous')} />
                        <span>Анонимный опрос</span>
                    </label>
                    <label className={styles.checkbox}>
                        <input type="checkbox" {...register('only_one_response')} />
                        <span>Только один ответ от пользователя</span>
                    </label>
                </div>

                <div className={styles.questionsHeader}>
                    <h2 className={styles.questionsTitle}>Вопросы</h2>
                    <Button type="button" onClick={addQuestion}>+ Добавить вопрос</Button>
                </div>

                {questionFields.map((field, qIndex) => (
                    <QuestionBlock
                        key={field.id}
                        index={qIndex}
                        control={control}
                        register={register}
                        errors={errors}
                        watch={watch}
                        setValue={setValue}
                        onRemove={() => removeQuestion(qIndex)}
                    />
                ))}

                {errors.questions?.root?.message && (
                    <div className={styles.globalError}>{errors.questions.root.message}</div>
                )}

                <div className={styles.actions}>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Создание...' : 'Создать опрос'}
                    </Button>
                </div>
            </form>
        </div>
    )
}

type QuestionBlockProps = {
    index: number
    control: any
    register: any
    errors: any
    watch: any
    setValue: any
    onRemove: () => void
}

const QuestionBlock = ({
    index,
    control,
    register,
    errors,
    watch,
    setValue,
    onRemove,
}: QuestionBlockProps) => {
    const questionType = watch(`questions.${index}.type`)
    const isChoice = isChoiceType(questionType)

    const { fields: optionFields, append: appendOption, remove: removeOption } = useFieldArray({
        control,
        name: `questions.${index}.options`,
    })

    useEffect(() => {
        if (!isChoice) {
            setValue(`questions.${index}.options`, [], { shouldValidate: false })
        }
    }, [isChoice, index, setValue])

    const addOption = () => {
        appendOption({ text: '', position: optionFields.length })
    }

    return (
        <div className={styles.questionCard}>
            <div className={styles.questionHeader}>
                <span className={styles.questionNumber}>Вопрос #{index + 1}</span>
                <button type="button" className={styles.removeBtn} onClick={onRemove}>
                    ✕ Удалить
                </button>
            </div>

            <div className={styles.field}>
                <label className={styles.label}>Текст вопроса *</label>
                <input
                    {...register(`questions.${index}.text`)}
                    className={errors.questions?.[index]?.text ? styles.inputError : ''}
                />
            </div>

            <div className={styles.row}>
                <div className={styles.field}>
                    <label className={styles.label}>Тип *</label>
                    <select {...register(`questions.${index}.type`)}>
                        {QUESTION_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                    </select>
                </div>

                <div className={styles.field}>
                    <label className={styles.label}>Позиция *</label>
                    <input
                        type="number"
                        {...register(`questions.${index}.position`, { valueAsNumber: true })}
                        className={errors.questions?.[index]?.position ? styles.inputError : ''}
                    />
                </div>

                <label className={styles.checkbox}>
                    <input type="checkbox" {...register(`questions.${index}.is_required`)} />
                    <span>Обязательный</span>
                </label>
            </div>

            {isChoice && (
                <div className={styles.options}>
                    <div className={styles.optionsHeader}>
                        <span>Варианты ответов</span>
                        <button type="button" className={styles.addOptionBtn} onClick={addOption}>
                            + Вариант
                        </button>
                    </div>
                    {optionFields.map((opt, oIndex) => (
                        <div key={opt.id} className={styles.optionRow}>
                            <input
                                {...register(`questions.${index}.options.${oIndex}.text`)}
                                placeholder={`Вариант ${oIndex + 1}`}
                                className={errors.questions?.[index]?.options?.[oIndex]?.text ? styles.inputError : ''}
                            />
                            <input
                                type="number"
                                {...register(`questions.${index}.options.${oIndex}.position`, { valueAsNumber: true })}
                                placeholder="Поз."
                                className={styles.optionPosition}
                            />
                            <button
                                type="button"
                                className={styles.removeOptionBtn}
                                onClick={() => removeOption(oIndex)}
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default SurveyBuilderPage