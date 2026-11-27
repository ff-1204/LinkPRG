import { start } from './ui/app.js?v=c4f04d2';

const app = start(document.getElementById('app'));
// 눈으로 확인하고 고칠 때 쓴다. 게임 규칙은 이 값에 기대지 않는다.
globalThis.__ttiring = app;
