"""Local deterministic smoke input. eSpeak NG is a synthetic fixture voice, not a premium AI narrator."""
import json, pathlib, subprocess, tempfile, wave, array, sys, math
ROOT=pathlib.Path(__file__).resolve().parent.parent
OUT=ROOT/'workspace'/'fixtures'
OUT.mkdir(parents=True,exist_ok=True)
PHRASES=[
    "작은 선택은 하루의 방향을 바꿉니다.",
    "처음부터 큰 목표를 이루려고 하면 쉽게 지칠 수 있습니다.",
    "대신 오늘 할 수 있는 작은 행동 하나를 정해 보세요.",
    "작은 행동을 반복하면 다음 선택이 조금 더 쉬워집니다.",
    "완벽한 하루가 아니어도 괜찮습니다.",
    "내일 다시 시작할 수 있도록 오늘의 한 걸음을 남겨 보세요.",
]
pcm=bytearray()
segments=[]
rate=None
def silence(ms):
    return bytes(round(rate*ms/1000)*2)
with tempfile.TemporaryDirectory() as tmp:
    for i,text in enumerate(PHRASES):
        wav=pathlib.Path(tmp)/f'{i}.wav'
        subprocess.run(['espeak-ng','-v','ko','-s','145','-w',str(wav),text],check=True)
        with wave.open(str(wav),'rb') as f:
            if f.getnchannels()!=1 or f.getsampwidth()!=2 or (rate and rate!=f.getframerate()):
                raise RuntimeError('Unexpected TTS WAV format')
            rate=f.getframerate()
            data=f.readframes(f.getnframes())
        samples=array.array('h')
        samples.frombytes(data)
        if sys.byteorder!='little':samples.byteswap()
        # Trim leading/trailing near-zero samples, preserving the internal utterance.
        audible=[j for j,x in enumerate(samples) if abs(x)>300]
        if not audible:raise RuntimeError('No audible speech')
        left=max(0,audible[0]-round(rate*.025))
        right=min(len(samples),audible[-1]+round(rate*.05)+1)
        if i==0:pcm.extend(silence(300))
        start=math.floor(len(pcm)/2/rate*1000)
        pcm.extend(data[left*2:right*2])
        end=math.ceil(len(pcm)/2/rate*1000)
        segments.append({'text':text,'startMs':start,'endMs':end})
        pcm.extend(silence(450 if i<len(PHRASES)-1 else 500))
with wave.open(str(OUT/'voice-fixture.wav'),'wb') as f:
    f.setnchannels(1);f.setsampwidth(2);f.setframerate(rate);f.writeframes(pcm)
duration=math.ceil(len(pcm)/2/rate*1000)
def srt_stamp(ms):
    return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02},{ms%1000:03}'
(OUT/'voice-fixture.srt').write_text('\n\n'.join(f"{i+1}\n{srt_stamp(s['startMs'])} --> {srt_stamp(s['endMs'])}\n{s['text']}" for i,s in enumerate(segments))+'\n',encoding='utf8')
(OUT/'voice-fixture.json').write_text(json.dumps({'script':' '.join(PHRASES),'durationMs':duration,'segments':segments,'voice':'eSpeak NG ko; measured per-utterance WAV boundaries, not ASR/forced alignment'},ensure_ascii=False,indent=2),encoding='utf8')
print('Korean synthetic speech fixture:',duration,'ms',len(segments),'utterances')
