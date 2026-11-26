import {z} from 'zod';
import {CreativeBriefSchema} from './creative-brief';
import {StyleId} from './styles';
import {VoiceOptions} from './elevenlabs';
export const QuickInput=z.object({topic:z.string().trim().min(1).max(500),brief:CreativeBriefSchema,styleId:StyleId,voice:VoiceOptions,consent:z.literal(true)}).strict();
export type QuickInput=z.infer<typeof QuickInput>;
export type QuickStage='script'|'voice'|'storyboard'|'render'|'verify'|'done';
export type QuickStatus={status:'running'|'done'|'error';stage:QuickStage;progress:number;projectId?:string;error?:string};
