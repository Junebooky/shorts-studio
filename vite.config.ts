import {defineConfig,loadEnv} from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';
import {localApi} from './server/api';
export default defineConfig(({mode})=>{const env=loadEnv(mode,process.cwd(),'ELEVENLABS_');return {plugins:[react(),tailwind(),localApi({apiKey:env.ELEVENLABS_API_KEY,defaultVoice:env.ELEVENLABS_VOICE_ID})],server:{host:'127.0.0.1',port:5173,strictPort:true}};});
