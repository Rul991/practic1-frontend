import { z } from "zod"

export const questionTypeSchema = z.enum([
    "single_choice",
    "multiple_choice",
    "text",
    "number",
    "boolean",
])
export const roleTypeSchema = z.enum(['admin', 'user'])

export const registerRequestSchema = z.object({
    login: z.string().min(3, "login >= 3"),
    password: z.string().min(6, "password >= 6"),
    name: z.string(),
})

export const loginRequestSchema = z.object({
    login: z.string(),
    password: z.string(),
})

export const userDtoSchema = z.object({
    id: z.number().int(),
    login: z.string(),
    name: z.string(),
    role: roleTypeSchema,
    created_at: z.iso.datetime(),
})

export const loginResponseSchema = z.object({
    token: z.string(),
    expires_at: z.iso.datetime(),
})

export const registerResponseSchema = loginResponseSchema

export const newOptionSchema = z.object({
    text: z.string(),
    position: z.number().int(),
})

export const newQuestionSchema = z.object({
    text: z.string(),
    type: questionTypeSchema,
    is_required: z.boolean(),
    position: z.number().int(),
    options: z.array(newOptionSchema).default([]),
})

export const createSurveyRequestSchema = z.object({
    title: z.string().trim().min(1, "title required"),
    description: z.string().nullish(),
    is_anonymous: z.boolean().default(false),
    only_one_response: z.boolean().default(false),
    questions: z.array(newQuestionSchema).superRefine((qs, ctx) => {
        const seen = new Set<number>()
        for (const q of qs) {
            if (seen.has(q.position)) {
                ctx.addIssue({
                    code: "custom",
                    message: `duplicate question position ${q.position}`,
                })
            }
            seen.add(q.position)
            const isChoice = q.type === "single_choice" || q.type === "multiple_choice"
            if (isChoice && q.options.length === 0) {
                ctx.addIssue({ code: "custom", message: `question '${q.text}' needs options` })
            }
            if (!isChoice && q.options.length > 0) {
                ctx.addIssue({ code: "custom", message: `question '${q.text}' cannot have options` })
            }
            const optSeen = new Set<number>()
            for (const o of q.options) {
                if (optSeen.has(o.position)) {
                    ctx.addIssue({
                        code: "custom",
                        message: `duplicate option position ${o.position} in question '${q.text}'`,
                    })
                }
                optSeen.add(o.position)
            }
        }
    }),
})

export const updateSurveyRequestSchema = z.object({
    title: z.string().trim().min(1, "title cannot be empty").optional(),
    description: z.string().nullable().optional(),
    is_anonymous: z.boolean().optional(),
    only_one_response: z.boolean().optional(),
})

export const optionDtoSchema = z.object({
    id: z.number().int(),
    text: z.string(),
    position: z.number().int(),
})

export const questionDtoSchema = z.object({
    id: z.number().int(),
    text: z.string(),
    type: questionTypeSchema,
    is_required: z.boolean(),
    position: z.number().int(),
    options: z.array(optionDtoSchema),
})

export const surveyDtoSchema = z.object({
    id: z.number().int(),
    link: z.string(),
    title: z.string(),
    description: z.string().nullable(),
    is_anonymous: z.boolean(),
    only_one_response: z.boolean(),
    created_at: z.iso.datetime(),
    questions: z.array(questionDtoSchema),
})

export const surveySummaryDtoSchema = z.object({
    id: z.number().int(),
    title: z.string(),
    link: z.string(),
    created_at: z.iso.datetime(),
    response_count: z.number().int(),
})

export const surveyListResponseSchema = z.object({
    items: z.array(surveySummaryDtoSchema),
})

export const newAnswerSchema = z
    .object({
        question_id: z.number().int(),
        option_id: z.number().int().optional(),
        text_value: z.string().max(4096, "text too long (max 4096)").optional(),
        numeric_value: z.number().optional(),
        bool_value: z.boolean().optional(),
    })
    .superRefine((a, ctx) => {
        const set = [a.option_id, a.text_value, a.numeric_value, a.bool_value].filter(
            (v) => v !== undefined,
        ).length
        if (set !== 1) {
            ctx.addIssue({
                code: "custom",
                message: `question ${a.question_id}: exactly one value required`,
            })
        }
    })

export const submitResponseRequestSchema = z.object({
    answers: z.array(newAnswerSchema),
})

export const submitResponseReplySchema = z.object({
    response_id: z.number().int(),
    created_at: z.iso.datetime(),
})

export const userBriefDtoSchema = z.object({
    id: z.number().int(),
    login: z.string(),
    name: z.string(),
})

export const answerDetailSchema = z.object({
    question_id: z.number().int(),
    question_text: z.string().optional(),
    option_id: z.number().int().optional(),
    option_text: z.string().optional(),
    text_value: z.string().optional(),
    numeric_value: z.number().optional(),
    bool_value: z.boolean().optional(),
})

export const responseListItemSchema = z.object({
    response_id: z.number().int(),
    created_at: z.iso.datetime(),
    user: userBriefDtoSchema.optional(),
    answers: z.array(answerDetailSchema).nullish(),
})

export const responseListResponseSchema = z.object({
    items: z.array(responseListItemSchema),
})

export const choiceStatSchema = z.object({
    option_id: z.number().int(),
    text: z.string(),
    count: z.number().int(),
})

export const booleanStatSchema = z.object({
    true: z.number().int(),
    false: z.number().int(),
})

export const numberStatSchema = z.object({
    count: z.number().int(),
    avg: z.number().nullable(),
    min: z.number().nullable(),
    max: z.number().nullable(),
})

export const questionResultSchema = z.object({
    id: z.number().int(),
    text: z.string(),
    type: questionTypeSchema,
    data: z.union([
        z.array(choiceStatSchema),
        booleanStatSchema,
        numberStatSchema,
        z.array(z.string()),
        z.null(),
    ]),
})

export const surveyResultsSchema = z.object({
    survey_id: z.number().int(),
    total_responses: z.number().int(),
    questions: z.array(questionResultSchema),
})

export const errorCodeSchema = z.enum([
    "VALIDATION_FAILED",
    "UNAUTHORIZED",
    "FORBIDDEN",
    "NOT_FOUND",
    "CONFLICT",
    "DB_ERROR",
    "INTERNAL",
])

export const errorBodySchema = z.object({
    error: z.object({
        code: errorCodeSchema,
        message: z.string(),
    }),
})

export const pageParamsSchema = z.object({
    limit: z.coerce.number().int().min(1).max(200).optional(),
    offset: z.coerce.number().int().min(0).optional(),
})