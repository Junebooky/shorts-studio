import type {PresetId} from '../core/styles';

// These presets choose colors only. Scene composition and animation follow the script.
export const styleCopy: Record<PresetId, {summary:string;detail:string}> = {
 editorial:{summary:'크림색과 차분한 녹색',detail:'따뜻한 크림색 배경에 짙은 녹색 글자와 청록색 포인트를 사용해요.'},
 kinetic:{summary:'검은색과 밝은 라임색',detail:'검은 배경에 흰 글자와 밝은 라임색 포인트를 사용해요.'},
 data:{summary:'연한 파란색과 선명한 파란색',detail:'연한 파란색 배경에 짙은 남색 글자와 선명한 파란색 포인트를 사용해요.'},
 cinematic:{summary:'짙은 남색과 따뜻한 주황색',detail:'짙은 남색 배경에 밝은 크림색 글자와 따뜻한 주황색 포인트를 사용해요.'},
 minimal:{summary:'흰색과 은은한 보라색',detail:'흰 배경에 짙은 회색 글자와 보라색 포인트를 사용해요.'},
 illustrated:{summary:'살구색과 자주색',detail:'연한 살구색 배경에 짙은 보라색 글자와 자주색 포인트를 사용해요.'},
};
export const paletteHelp='영상 전체에 사용할 색상을 골라요. 장면 구성과 움직임은 대사에 맞춰 별도로 설계해요.';
