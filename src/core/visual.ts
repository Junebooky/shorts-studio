import {z} from 'zod';
import {MechanismSchema,SemiconductorSchema} from './semantic-motion';
import {CreativePlanSchema} from './creative-brief';
const label=z.string().trim().min(1).max(10);
export const VisualSchema=z.discriminatedUnion('type',[
 MechanismSchema,SemiconductorSchema,
 z.object({type:z.literal('path'),labels:z.tuple([label,label,label])}),
 z.object({type:z.literal('contrast'),left:label,right:label}),
 z.object({type:z.literal('cycle'),labels:z.tuple([label,label,label])}),
 z.object({type:z.literal('focus'),word:z.string().trim().min(1).max(12)}),
 z.object({type:z.literal('typography'),lines:z.tuple([label,label])}),
]);
export type Visual=z.infer<typeof VisualSchema>;
export const DirectionSchema=z.object({concept:z.string().trim().min(1).max(240),audience:z.string().trim().min(1).max(120),style:z.string().trim().min(1).max(120),author:z.enum(['agent','human','fixture']),plan:CreativePlanSchema.optional(),briefKey:z.string().max(6000).optional()});
export const SceneIntentSchema=z.object({purpose:z.string().trim().min(1).max(140),metaphor:z.string().trim().min(1).max(140),captionIds:z.array(z.string().min(1)).min(1).max(1000)});
