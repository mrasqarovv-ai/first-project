import { GenerateGameRequest, GameSnapshot } from '@oquplay/shared';
export interface LLMConfig {
    apiKey?: string;
    baseUrl: string;
    model: string;
}
export declare function getLLMConfig(): LLMConfig;
/**
 * Calls the real LLM API or returns high-quality pedagogical Demo content
 */
export declare function generateGameWithAI(request: GenerateGameRequest): Promise<{
    snapshot: GameSnapshot;
    isDemo: boolean;
    error?: string;
}>;
//# sourceMappingURL=llm-service.d.ts.map