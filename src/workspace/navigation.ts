export type WorkspaceItem={id:string;label:string;description:string;ready:boolean};
export type WorkspaceGroup={id:string;label:string;items:readonly WorkspaceItem[]};
export const workspaceGroups=[
 {id:'home',label:'마케팅 홈',items:[{id:'marketing-home',label:'마케팅 홈',description:'캠페인을 기획하고 콘텐츠 제작 도구를 선택해요.',ready:true}]},
 {id:'video',label:'영상 제작',items:[
  {id:'video-studio',label:'영상 작업 공간',description:'AI 영상 제작과 직접 편집을 한 곳에서 이용해요.',ready:true},
  {id:'video-guide',label:'제작 가이드',description:'영상 제작 순서와 검수 방법을 확인해요.',ready:true}]},
 {id:'card-news',label:'카드뉴스 제작',items:[
  {id:'card-create',label:'카드뉴스 만들기',description:'페이지별로 카드뉴스를 편집하고 PNG로 내보내요.',ready:true},
  {id:'card-templates',label:'디자인 템플릿',description:'카드뉴스의 디자인과 브랜드 스타일을 관리하는 공간이에요.',ready:false}]},
 {id:'threads',label:'스레드 제작',items:[
  {id:'thread-create',label:'스레드 작성',description:'이어지는 게시글을 편집하고 복사하거나 저장해요.',ready:true},
  {id:'thread-repurpose',label:'콘텐츠 재활용',description:'공통 영상 또는 직접 작성한 원고를 스레드로 구성해요.',ready:true}]},
 {id:'research',label:'트렌드 분석',items:[
  {id:'trending-videos',label:'최신 인기영상 추출',description:'인기 영상의 주제와 콘텐츠 흐름을 살펴보는 공간이에요.',ready:false},
  {id:'research-keywords',label:'키워드·아이디어',description:'관심 주제와 마케팅 아이디어를 모으는 공간이에요.',ready:false}]},
 {id:'publishing',label:'배포 및 일정',items:[
  {id:'publishing-calendar',label:'콘텐츠 캘린더',description:'채널별 발행 계획을 관리하는 공간이에요.',ready:false},
  {id:'publishing-channels',label:'채널 관리',description:'콘텐츠를 배포할 채널을 관리하는 공간이에요.',ready:false}]},
 {id:'analytics',label:'성과 분석',items:[
  {id:'analytics-overview',label:'콘텐츠 성과',description:'발행한 콘텐츠의 성과를 확인하는 공간이에요.',ready:false}]},
 {id:'library',label:'콘텐츠 라이브러리',items:[
  {id:'brand-kit',label:'브랜드 키트',description:'브랜드 컬러, 로고, 말투와 디자인을 관리해요.',ready:true},
  {id:'library-assets',label:'공통 소재 관리',description:'여러 콘텐츠에서 함께 사용할 소재를 관리하는 공간이에요.',ready:false}]}
] as const satisfies readonly WorkspaceGroup[];
export type GroupId=typeof workspaceGroups[number]['id'];
export type WorkspaceId=typeof workspaceGroups[number]['items'][number]['id'];
export const defaultWorkspace:WorkspaceId='marketing-home';
export function findWorkspace(id:WorkspaceId){
 for(const group of workspaceGroups){const item=group.items.find(item=>item.id===id);if(item)return {group,item};}
 throw new Error('알 수 없는 작업 공간');
}
export function toggleGroup(groups:readonly GroupId[],id:GroupId):GroupId[]{
 return groups.includes(id)?groups.filter(group=>group!==id):[...groups,id];
}
