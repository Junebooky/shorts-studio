"""Synthetic isolated Korean words for frame regression; not natural narration or ASR."""
import array, json, math, pathlib, subprocess, tempfile, wave, sys
ROOT=pathlib.Path(__file__).resolve().parent.parent
OUT=ROOT/'workspace'/'speech-cue-fixture'
OUT.mkdir(parents=True,exist_ok=True)
words=['준비','지금','선택','선택']
pcm=bytearray()
anchors=[]
rate=None
def silence(ms):
    pcm.extend(bytes(round(rate*ms/1000)*2))
with tempfile.TemporaryDirectory() as tmp:
    for i,word in enumerate(words):
        f=pathlib.Path(tmp)/f'{i}.wav'
        subprocess.run(['espeak-ng','-v','ko','-s','145','-w',str(f),word],check=True)
        with wave.open(str(f),'rb') as wav:
            if wav.getnchannels()!=1 or wav.getsampwidth()!=2 or (rate and rate!=wav.getframerate()):
                raise RuntimeError('Unexpected WAV format')
            rate=wav.getframerate()
            data=wav.readframes(wav.getnframes())
        samples=array.array('h')
        samples.frombytes(data)
        if sys.byteorder!='little': samples.byteswap()
        audible=[j for j,x in enumerate(samples) if abs(x)>300]
        if not audible: raise RuntimeError('Empty synthetic word')
        left=max(0,audible[0]-round(rate*.025))
        right=min(len(samples),audible[-1]+round(rate*.050)+1)
        silence([200,437,351,550][i])
        # Ensure a non-frame-aligned second-scene start for the absolute/local frame test.
        if i==1 and math.floor(len(pcm)/2/rate*1000)%100==0:
            silence(7)
        start=math.floor(len(pcm)/2/rate*1000)
        pcm.extend(data[left*2:right*2])
        end=math.ceil(len(pcm)/2/rate*1000)
        anchors.append({'text':word,'startMs':start,'endMs':end})
    silence(800)
with wave.open(str(OUT/'voice.wav'),'wb') as wav:
    wav.setnchannels(1);wav.setsampwidth(2);wav.setframerate(rate);wav.writeframes(pcm)
metadata={'script':' '.join(words),'durationMs':math.ceil(len(pcm)/2/rate*1000),'words':anchors,'source':'isolated eSpeak NG Korean words; sample-count boundaries with 25/50ms padding, not ASR'}
(OUT/'metadata.json').write_text(json.dumps(metadata,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps(metadata,ensure_ascii=False))
