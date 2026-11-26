// 설정 (G4-3, G4-4). 저장 칸과 따로, 이 기기에 남는다.

const KEY = 'ttiring.settings';

export const DEFAULTS = {
  fs: 1,          // 글자 크기 1 보통, 2 크게, 3 아주 크게
  contrast: false,
  calm: false,    // 움직임 줄이기
  art: true,      // 그림 (X1-5)
  sound: 2,       // 0 끔, 1 작게, 2 보통, 3 크게
  chatter: 'mid', // 가상 유저 잡담 low, mid, high
  dingWin: 2,     // 창으로 뜨는 띠링: 1 모두, 2 귀한 것부터, 3 아주 귀한 것만
  stripFolded: false,
  assist: 'off',  // 누르기 돕기: off 끔, hold 누르고 있기, toggle 한 번 눌러 이어 하기 (H2-5). 이 기기에만 남고 저장 칸에는 들어가지 않는다
};

export function loadSettings(storage) {
  try {
    return { ...DEFAULTS, ...JSON.parse(storage.getItem(KEY) || '{}') };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSettings(storage, settings) {
  try { storage.setItem(KEY, JSON.stringify(settings)); } catch { /* 설정을 못 남겨도 게임은 된다 */ }
}

export function applySettings(settings, root = document.documentElement) {
  root.classList.toggle('fs-2', settings.fs === 2);
  root.classList.toggle('fs-3', settings.fs === 3);
  root.classList.toggle('contrast', !!settings.contrast);
  root.classList.toggle('calm', !!settings.calm);
}

export const SETTING_GROUPS = [
  { title: '보기', rows: [
    { key: 'fs', label: '글자 크기', options: [[1, '보통'], [2, '크게'], [3, '아주 크게']] },
    { key: 'contrast', label: '고대비', options: [[false, '끔'], [true, '켬']] },
    { key: 'calm', label: '움직임 줄이기', options: [[false, '끔'], [true, '켬']] },
    { key: 'art', label: '그림', options: [[true, '켬'], [false, '끔 (글만)']] },
  ] },
  { title: '소리', rows: [
    { key: 'sound', label: '띠링 소리', options: [[0, '끔'], [1, '작게'], [2, '보통'], [3, '크게']] },
  ] },
  { title: '게임', rows: [
    { key: 'chatter', label: '가상 유저 잡담', options: [['low', '적게'], ['mid', '보통'], ['high', '많이']] },
    { key: 'dingWin', label: '창으로 뜨는 띠링', options: [[1, '모두'], [2, '귀한 것부터'], [3, '아주 귀한 것만']] },
    { key: 'assist', label: '누르기 돕기 (1초에 한 번)', options: [['off', '끔'], ['hold', '누르고 있기'], ['toggle', '한 번 눌러 이어 하기']] },
  ] },
];
