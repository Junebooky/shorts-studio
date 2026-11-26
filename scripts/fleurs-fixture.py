"""Read pinned public Korean FLEURS test data (CC BY 4.0, Conneau et al. 2022).
No private audio is uploaded, and the source audio is not committed or published as an artifact.
"""
import json, pathlib, wave, io, hashlib, math
from huggingface_hub import hf_hub_download
import pyarrow.parquet as pq
ROOT=pathlib.Path(__file__).resolve().parent.parent
OUT=ROOT/'workspace'/'fixtures'
OUT.mkdir(parents=True,exist_ok=True)
REV='44ebc3e0222cda1571220d148f3e3163843747dd'
file=hf_hub_download(repo_id='google/fleurs',repo_type='dataset',revision=REV,filename='ko_kr/test-00000-of-00001.parquet')
table=pq.ParquetFile(file)
row=next(table.iter_batches(batch_size=1,columns=['audio','raw_transcription','transcription'])).to_pylist()[0]
wav=row['audio']['bytes']
if not wav:raise RuntimeError('No audio bytes in pinned parquet')
with wave.open(io.BytesIO(wav),'rb') as f:duration=math.ceil(f.getnframes()/f.getframerate()*1000)
script=(row.get('raw_transcription') or row['transcription']).strip()
(OUT/'fleurs-fixture.wav').write_bytes(wav)
(OUT/'fleurs-fixture.json').write_text(json.dumps({'script':script,'durationMs':duration,'voice':'FLEURS public Korean read speech, google/fleurs ko_kr test row 0, CC BY 4.0, Conneau et al. 2022; revision '+REV,'datasetRow':0,'audioSha256':hashlib.sha256(wav).hexdigest()},ensure_ascii=False,indent=2),encoding='utf8')
print('FLEURS public recorded speech:',duration,'ms',REV)
