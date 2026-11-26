"""Synthetic isolated Korean words, not natural speech, not provider/ASR evidence."""
import json, pathlib, subprocess, tempfile, math, array, sys
ROOT=pathlib.Path(__file__).resolve().parent.parent
OUT=ROOT/'workspace'/'full-length-voice-fixture'
OUT.mkdir(parents=True,exist_ok=True)
script='반도체는 어떻게 작은 회로를 만들까요? 먼저 매끈한 웨이퍼를 준비합니다. 표면에 얇은 막을 입혀 빛에 반응하도록 만들어요. 빛을 이용해 원하는 모양을 새기고 필요한 부분만 남깁니다. 불필요한 부분은 깎아내고 전기가 흐르는 길을 연결합니다. 이런 작업을 여러 번 반복하면 작은 공간에 복잡한 회로가 만들어져요. 마지막으로 각각의 회로가 제대로 작동하는지 검사합니다. 작은 층이 쌓여 우리가 사용하는 기기의 핵심이 되는 거죠.'
words=script.split()
rate=24000
clips=[]
with tempfile.TemporaryDirectory() as tmp:
    for i,word in enumerate(words):
        wav=pathlib.Path(tmp)/f'{i}.wav'
        subprocess.run(['espeak-ng','-v','ko','-s','165','-w',str(wav),word],check=True)
        raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(wav),'-ar',str(rate),'-ac','1','-f','s16le','pipe:1'])
        samples=array.array('h');samples.frombytes(raw)
        if sys.byteorder!='little':samples.byteswap()
        audible=[i for i,x in enumerate(samples) if abs(x)>300]
        if not audible: raise RuntimeError('Silent fixture word '+word)
        lo=max(0,audible[0]-round(rate*.025));hi=min(len(samples),audible[-1]+round(rate*.04)+1)
        clips.append(raw[2*lo:2*hi])
spoken_samples=sum(len(x)//2 for x in clips)
# Add only inter-word gaps, not time stretching. Aim for ~42 seconds if feasible.
gap=max(round(rate*.12),min(round(rate*.55),math.ceil((42*rate-spoken_samples-rate)/(len(words)-1))))
pcm=bytearray(bytes(round(rate*.25)*2))
chars=[];starts=[];ends=[];anchors=[]
for i,(word,clip) in enumerate(zip(words,clips)):
    if i:
        start_space=len(pcm)//2
        pcm.extend(bytes(gap*2))
        chars.append(' ');starts.append(start_space/rate);ends.append((len(pcm)//2)/rate)
    start=len(pcm)//2;n=len(clip)//2
    pcm.extend(clip)
    # Only WORD boundaries are measured; evenly partitioned characters are synthetic
    # transport data used to exercise ElevenLabs-shaped mock, never real ASR evidence.
    for j,ch in enumerate(word):
        chars.append(ch);starts.append((start+j*n//len(word))/rate);ends.append((start+(j+1)*n//len(word))/rate)
    anchors.append({'text':word,'startSample':start,'endSample':start+n})
pcm.extend(bytes(round(rate*.75)*2))
duration=math.ceil(len(pcm)//2/rate*1000)
if not 35000<=duration<=60000:raise RuntimeError(f'Fixture outside 35–60s: {duration}ms; speech {spoken_samples/rate:.2f}s')
assert ''.join(chars)==script
(OUT/'narration.pcm').write_bytes(pcm)
(OUT/'metadata.json').write_text(json.dumps({'script':script,'durationMs':duration,'sampleRate':rate,'wordBoundaries':anchors,'alignment':{'characters':chars,'character_start_times_seconds':starts,'character_end_times_seconds':ends},'source':'eSpeak NG isolated Korean words; measured sample boundaries; within-word synthetic character subdivisions, not ASR or ElevenLabs'},ensure_ascii=False,indent=2),encoding='utf8')
print('Synthetic Korean speech fixture',duration,'ms;',len(words),'words; gap',gap/rate,'s')
