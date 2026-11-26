"""Fetch one public Korean read-speech sample from FLEURS, no private audio.
Source: https://huggingface.co/datasets/google/fleurs (CC BY 4.0; Conneau et al., 2022).
"""
import json, urllib.request, pathlib, wave, io, hashlib, math, time
ROOT=pathlib.Path(__file__).resolve().parent.parent
OUT=ROOT/'workspace'/'fixtures'
OUT.mkdir(parents=True,exist_ok=True)
def get(url):
    for attempt in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'ShortsStudio-ASR-test/1.0'}),timeout=90) as r:return r.read()
        except Exception:
            if attempt==2:raise
            time.sleep(2)
url='https://datasets-server.huggingface.co/rows?dataset=google%2Ffleurs&config=ko_kr&split=test&offset=0&length=1'
data=json.loads(get(url))
row=data['rows'][0]['row']
audio=row['audio']
if isinstance(audio,list):audio=audio[0]
if not audio.get('src'):raise RuntimeError('No public audio URL')
wav=get(audio['src'])
with wave.open(io.BytesIO(wav),'rb') as f:duration=math.ceil(f.getnframes()/f.getframerate()*1000)
script=(row.get('raw_transcription') or row['transcription']).strip()
(OUT/'fleurs-fixture.wav').write_bytes(wav)
(OUT/'fleurs-fixture.json').write_text(json.dumps({'script':script,'durationMs':duration,'voice':'FLEURS public Korean read speech, google/fleurs ko_kr test row 0, CC BY 4.0, Conneau et al. 2022','datasetRow':0,'audioSha256':hashlib.sha256(wav).hexdigest()},ensure_ascii=False,indent=2),encoding='utf8')
print('FLEURS public recorded speech:',duration,'ms')
