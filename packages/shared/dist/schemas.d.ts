import { z } from 'zod';
export declare const LanguageSchema: z.ZodEnum<["kk", "ru"]>;
export declare const DifficultyLevelSchema: z.ZodEnum<["A", "B", "C"]>;
export declare const GameTypeSchema: z.ZodEnum<["QUIZ", "MATCHING", "ORDERING"]>;
export declare const GameStatusSchema: z.ZodEnum<["DRAFT", "PUBLISHED", "ARCHIVED"]>;
export declare const UserRoleSchema: z.ZodEnum<["TEACHER", "STUDENT", "GUEST"]>;
export declare const GenerateGameRequestSchema: z.ZodObject<{
    sourceText: z.ZodString;
    subject: z.ZodString;
    topic: z.ZodOptional<z.ZodString>;
    grade: z.ZodNumber;
    language: z.ZodEnum<["kk", "ru"]>;
    difficulty: z.ZodEnum<["A", "B", "C"]>;
    gameType: z.ZodEnum<["QUIZ", "MATCHING", "ORDERING"]>;
    itemCount: z.ZodEffects<z.ZodNumber, number, number>;
    timeLimitEnabled: z.ZodDefault<z.ZodBoolean>;
    timeLimitSeconds: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    sourceText: string;
    subject: string;
    grade: number;
    language: "kk" | "ru";
    difficulty: "A" | "B" | "C";
    gameType: "QUIZ" | "MATCHING" | "ORDERING";
    itemCount: number;
    timeLimitEnabled: boolean;
    topic?: string | undefined;
    timeLimitSeconds?: number | undefined;
}, {
    sourceText: string;
    subject: string;
    grade: number;
    language: "kk" | "ru";
    difficulty: "A" | "B" | "C";
    gameType: "QUIZ" | "MATCHING" | "ORDERING";
    itemCount: number;
    topic?: string | undefined;
    timeLimitEnabled?: boolean | undefined;
    timeLimitSeconds?: number | undefined;
}>;
export type GenerateGameRequest = z.infer<typeof GenerateGameRequestSchema>;
export declare const QuizOptionSchema: z.ZodObject<{
    id: z.ZodString;
    text: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    text: string;
}, {
    id: string;
    text: string;
}>;
export declare const QuizTaskSchema: z.ZodEffects<z.ZodObject<{
    id: z.ZodString;
    orderIndex: z.ZodNumber;
    question: z.ZodString;
    options: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        text: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        text: string;
    }, {
        id: string;
        text: string;
    }>, "many">;
    correctOptionId: z.ZodString;
    explanation: z.ZodString;
    sourceExcerpt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    options: {
        id: string;
        text: string;
    }[];
    id: string;
    orderIndex: number;
    question: string;
    correctOptionId: string;
    explanation: string;
    sourceExcerpt: string;
}, {
    options: {
        id: string;
        text: string;
    }[];
    id: string;
    orderIndex: number;
    question: string;
    correctOptionId: string;
    explanation: string;
    sourceExcerpt: string;
}>, {
    options: {
        id: string;
        text: string;
    }[];
    id: string;
    orderIndex: number;
    question: string;
    correctOptionId: string;
    explanation: string;
    sourceExcerpt: string;
}, {
    options: {
        id: string;
        text: string;
    }[];
    id: string;
    orderIndex: number;
    question: string;
    correctOptionId: string;
    explanation: string;
    sourceExcerpt: string;
}>;
export declare const MatchingPairSchema: z.ZodObject<{
    id: z.ZodString;
    left: z.ZodString;
    right: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    left: string;
    right: string;
}, {
    id: string;
    left: string;
    right: string;
}>;
export declare const MatchingTaskSchema: z.ZodEffects<z.ZodObject<{
    id: z.ZodString;
    orderIndex: z.ZodNumber;
    instructions: z.ZodString;
    pairs: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        left: z.ZodString;
        right: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        left: string;
        right: string;
    }, {
        id: string;
        left: string;
        right: string;
    }>, "many">;
    explanation: z.ZodString;
    sourceExcerpt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    orderIndex: number;
    explanation: string;
    sourceExcerpt: string;
    instructions: string;
    pairs: {
        id: string;
        left: string;
        right: string;
    }[];
}, {
    id: string;
    orderIndex: number;
    explanation: string;
    sourceExcerpt: string;
    instructions: string;
    pairs: {
        id: string;
        left: string;
        right: string;
    }[];
}>, {
    id: string;
    orderIndex: number;
    explanation: string;
    sourceExcerpt: string;
    instructions: string;
    pairs: {
        id: string;
        left: string;
        right: string;
    }[];
}, {
    id: string;
    orderIndex: number;
    explanation: string;
    sourceExcerpt: string;
    instructions: string;
    pairs: {
        id: string;
        left: string;
        right: string;
    }[];
}>;
export declare const OrderItemSchema: z.ZodObject<{
    id: z.ZodString;
    text: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    text: string;
}, {
    id: string;
    text: string;
}>;
export declare const OrderingTaskSchema: z.ZodEffects<z.ZodObject<{
    id: z.ZodString;
    orderIndex: z.ZodNumber;
    instructions: z.ZodString;
    items: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        text: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        text: string;
    }, {
        id: string;
        text: string;
    }>, "many">;
    correctOrderIds: z.ZodArray<z.ZodString, "many">;
    explanation: z.ZodString;
    sourceExcerpt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    orderIndex: number;
    explanation: string;
    sourceExcerpt: string;
    instructions: string;
    items: {
        id: string;
        text: string;
    }[];
    correctOrderIds: string[];
}, {
    id: string;
    orderIndex: number;
    explanation: string;
    sourceExcerpt: string;
    instructions: string;
    items: {
        id: string;
        text: string;
    }[];
    correctOrderIds: string[];
}>, {
    id: string;
    orderIndex: number;
    explanation: string;
    sourceExcerpt: string;
    instructions: string;
    items: {
        id: string;
        text: string;
    }[];
    correctOrderIds: string[];
}, {
    id: string;
    orderIndex: number;
    explanation: string;
    sourceExcerpt: string;
    instructions: string;
    items: {
        id: string;
        text: string;
    }[];
    correctOrderIds: string[];
}>;
export declare const GeneratedGameSnapshotSchema: z.ZodObject<{
    schemaVersion: z.ZodLiteral<"1.0">;
    title: z.ZodString;
    subject: z.ZodString;
    grade: z.ZodNumber;
    language: z.ZodEnum<["kk", "ru"]>;
    difficulty: z.ZodEnum<["A", "B", "C"]>;
    gameType: z.ZodEnum<["QUIZ", "MATCHING", "ORDERING"]>;
    instructions: z.ZodString;
    items: z.ZodArray<z.ZodUnion<[z.ZodEffects<z.ZodObject<{
        id: z.ZodString;
        orderIndex: z.ZodNumber;
        question: z.ZodString;
        options: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            text: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            id: string;
            text: string;
        }, {
            id: string;
            text: string;
        }>, "many">;
        correctOptionId: z.ZodString;
        explanation: z.ZodString;
        sourceExcerpt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        options: {
            id: string;
            text: string;
        }[];
        id: string;
        orderIndex: number;
        question: string;
        correctOptionId: string;
        explanation: string;
        sourceExcerpt: string;
    }, {
        options: {
            id: string;
            text: string;
        }[];
        id: string;
        orderIndex: number;
        question: string;
        correctOptionId: string;
        explanation: string;
        sourceExcerpt: string;
    }>, {
        options: {
            id: string;
            text: string;
        }[];
        id: string;
        orderIndex: number;
        question: string;
        correctOptionId: string;
        explanation: string;
        sourceExcerpt: string;
    }, {
        options: {
            id: string;
            text: string;
        }[];
        id: string;
        orderIndex: number;
        question: string;
        correctOptionId: string;
        explanation: string;
        sourceExcerpt: string;
    }>, z.ZodEffects<z.ZodObject<{
        id: z.ZodString;
        orderIndex: z.ZodNumber;
        instructions: z.ZodString;
        pairs: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            left: z.ZodString;
            right: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            id: string;
            left: string;
            right: string;
        }, {
            id: string;
            left: string;
            right: string;
        }>, "many">;
        explanation: z.ZodString;
        sourceExcerpt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        orderIndex: number;
        explanation: string;
        sourceExcerpt: string;
        instructions: string;
        pairs: {
            id: string;
            left: string;
            right: string;
        }[];
    }, {
        id: string;
        orderIndex: number;
        explanation: string;
        sourceExcerpt: string;
        instructions: string;
        pairs: {
            id: string;
            left: string;
            right: string;
        }[];
    }>, {
        id: string;
        orderIndex: number;
        explanation: string;
        sourceExcerpt: string;
        instructions: string;
        pairs: {
            id: string;
            left: string;
            right: string;
        }[];
    }, {
        id: string;
        orderIndex: number;
        explanation: string;
        sourceExcerpt: string;
        instructions: string;
        pairs: {
            id: string;
            left: string;
            right: string;
        }[];
    }>, z.ZodEffects<z.ZodObject<{
        id: z.ZodString;
        orderIndex: z.ZodNumber;
        instructions: z.ZodString;
        items: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            text: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            id: string;
            text: string;
        }, {
            id: string;
            text: string;
        }>, "many">;
        correctOrderIds: z.ZodArray<z.ZodString, "many">;
        explanation: z.ZodString;
        sourceExcerpt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        orderIndex: number;
        explanation: string;
        sourceExcerpt: string;
        instructions: string;
        items: {
            id: string;
            text: string;
        }[];
        correctOrderIds: string[];
    }, {
        id: string;
        orderIndex: number;
        explanation: string;
        sourceExcerpt: string;
        instructions: string;
        items: {
            id: string;
            text: string;
        }[];
        correctOrderIds: string[];
    }>, {
        id: string;
        orderIndex: number;
        explanation: string;
        sourceExcerpt: string;
        instructions: string;
        items: {
            id: string;
            text: string;
        }[];
        correctOrderIds: string[];
    }, {
        id: string;
        orderIndex: number;
        explanation: string;
        sourceExcerpt: string;
        instructions: string;
        items: {
            id: string;
            text: string;
        }[];
        correctOrderIds: string[];
    }>]>, "many">;
    isDemo: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    subject: string;
    grade: number;
    language: "kk" | "ru";
    difficulty: "A" | "B" | "C";
    gameType: "QUIZ" | "MATCHING" | "ORDERING";
    instructions: string;
    items: ({
        options: {
            id: string;
            text: string;
        }[];
        id: string;
        orderIndex: number;
        question: string;
        correctOptionId: string;
        explanation: string;
        sourceExcerpt: string;
    } | {
        id: string;
        orderIndex: number;
        explanation: string;
        sourceExcerpt: string;
        instructions: string;
        pairs: {
            id: string;
            left: string;
            right: string;
        }[];
    } | {
        id: string;
        orderIndex: number;
        explanation: string;
        sourceExcerpt: string;
        instructions: string;
        items: {
            id: string;
            text: string;
        }[];
        correctOrderIds: string[];
    })[];
    schemaVersion: "1.0";
    title: string;
    isDemo?: boolean | undefined;
}, {
    subject: string;
    grade: number;
    language: "kk" | "ru";
    difficulty: "A" | "B" | "C";
    gameType: "QUIZ" | "MATCHING" | "ORDERING";
    instructions: string;
    items: ({
        options: {
            id: string;
            text: string;
        }[];
        id: string;
        orderIndex: number;
        question: string;
        correctOptionId: string;
        explanation: string;
        sourceExcerpt: string;
    } | {
        id: string;
        orderIndex: number;
        explanation: string;
        sourceExcerpt: string;
        instructions: string;
        pairs: {
            id: string;
            left: string;
            right: string;
        }[];
    } | {
        id: string;
        orderIndex: number;
        explanation: string;
        sourceExcerpt: string;
        instructions: string;
        items: {
            id: string;
            text: string;
        }[];
        correctOrderIds: string[];
    })[];
    schemaVersion: "1.0";
    title: string;
    isDemo?: boolean | undefined;
}>;
export type GeneratedGameSnapshot = z.infer<typeof GeneratedGameSnapshotSchema>;
export declare function validateGeneratedGamePayload(payload: unknown, expectedGameType: string, expectedCount?: number): {
    success: boolean;
    errors: string[];
    data?: GeneratedGameSnapshot;
};
//# sourceMappingURL=schemas.d.ts.map