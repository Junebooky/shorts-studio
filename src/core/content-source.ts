import {z} from 'zod';
// The same contract is used by the shared workspace and the local creation endpoint.
export const NarrationSourceSchema=z.object({title:z.string().trim().min(1).max(90),script:z.string().trim().min(10).max(1000).refine(s=>/[가-힣]/.test(s),'한국어 원고를 입력해 주세요.')}).strict();
export type NarrationSource=z.infer<typeof NarrationSourceSchema>;
