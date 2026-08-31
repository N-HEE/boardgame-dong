// 여기만 수정하면 입장 코드/표시 이름을 바꿀 수 있습니다.
window.SITE_CONFIG = {
  title: '우리들의 게임 테이블',
  // 공유 리더보드를 쓰려면 Supabase 프로젝트 URL과 anon key를 입력하세요.
  // 비워두면 브라우저별 로컬 저장 모드로 동작합니다.
  supabaseUrl: '',
  supabaseAnonKey: '',
  users: [
    { id:'host',   name:'나',     code:'HOST',   avatar:'assets/characters/host.png' },
    { id:'somi',   name:'김소미', code:'SOMI',   avatar:'assets/characters/somi.png' },
    { id:'sieun',  name:'연시은', code:'SIEUN',  avatar:'assets/characters/sieun.png' },
    { id:'hyunsu', name:'차현수', code:'HYUNSU', avatar:'assets/characters/hyunsu.png' },
    { id:'sugang', name:'한수강', code:'SUGANG', avatar:'assets/characters/sugang.png' }
  ]
};
