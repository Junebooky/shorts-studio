// Display-only Korean labels; keep persisted report identifiers and evidence unchanged.
export function checkLabel(id:string,fallback:string):string{
 switch(id){case 'video':return '영상 압축 형식';case 'fps':return '초당 프레임 수';case 'audio':return '오디오 트랙';case 'probe':return 'MP4 파일 검사';case 'decode':return '전체 영상 읽기 검사';case 'frames':return '주요 장면 이미지';default:return fallback;}
}
export function checkStatusLabel(status:'pass'|'fail'|'not_checked'):string{
 return {pass:'통과',fail:'실패',not_checked:'미확인'}[status];
}
export function findingLabel(code:'unsafe'|'clipped'|'overlap'|'missing'):string{
 return {unsafe:'글자 영역이 안전 영역을 벗어났어요',clipped:'글자가 잘렸을 수 있어요',overlap:'글자가 겹쳤을 수 있어요',missing:'글자 위치를 확인하지 못했어요'}[code];
}
