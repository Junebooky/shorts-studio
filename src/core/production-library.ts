import {z} from 'zod';
export const FinalArtifact=z.object({version:z.literal(1),id:z.string().uuid(),projectId:z.string(),revision:z.number().int().nonnegative(),reviewRunId:z.string().uuid(),createdAt:z.string(),title:z.string(),bytes:z.number().int().positive(),sha256:z.string().regex(/^[a-f0-9]{64}$/),reviewer:z.enum(['user','agent']),testFixture:z.boolean()}).strict();
export type FinalArtifact=z.infer<typeof FinalArtifact>;
