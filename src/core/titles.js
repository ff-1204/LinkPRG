// 칭호의 효과는 얻은 칭호 모두에 늘 붙는다 (Z51, 사용자 요청). 다는 것은 이름 앞에 보이는 것뿐이다.
export function hasTitle(state, id) {
  return !!state?.titles?.some((t) => t.id === id);
}
