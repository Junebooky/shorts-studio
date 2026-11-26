import {defineConfig,loadEnv} from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';
import {localApi} from './server/api';
export default defineConfig(({mode})=>{const env=loadEnv(mode,process.cwd(),['ELEVENLABS_','OPENAI_','SHORTS_']);return {plugins:[react(),tailwind(),localApi({apiKey:env.ELEVENLABS_API_KEY,defaultVoice:env.ELEVENLABS_VOICE_ID,directorApiKey:env.OPENAI_API_KEY,directorModel:env.SHORTS_DIRECTOR_MODEL,directorLocalUrl:env.SHORTS_DIRECTOR_LOCAL_URL})],server:{host:'127.0.0.1',port:5173,strictPort:true}};});
