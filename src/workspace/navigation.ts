export type WorkspaceItem={id:string;label:string;description:string;ready:boolean};
export type WorkspaceGroup={id:string;label:string;items:readonly WorkspaceItem[]};
export const workspaceGroups=[
 {id:'home',label:'마케팅 홈',items:[{id:'marketing-home',label:'마케팅 홈',description:'캠페인을 정리하고 만들 콘텐츠를 골라요.',ready:true}]},
 {id:'video',label:'영상 제작',items:[
  {id:'video-studio',label:'영상 작업 공간',description:'AI로 영상을 만들거나 직접 편집해요.',ready:true},
  {id:'video-guide',label:'제작 가이드',description:'영상 제작 순서와 검수 방법을 확인해요.',ready:true}]},
 {id:'card-news',label:'카드뉴스 제작',items:[
  {id:'card-create',label:'카드뉴스 만들기',description:'주제에 맞춰 여러 장의 카드뉴스를 만드는 기능을 준비하고 있어요.',ready:false},
  {id:'card-templates',label:'디자인 양식',description:'카드뉴스에 쓸 디자인 양식을 준비하고 있어요.',ready:false}]},
 {id:'threads',label:'스레드 제작',items:[
  {id:'thread-create',label:'스레드 쓰기',description:'하나의 주제를 여러 게시글로 이어 쓰는 기능을 준비하고 있어요.',ready:false},
  {id:'thread-repurpose',label:'다른 콘텐츠로 만들기',description:'영상이나 카드뉴스의 내용을 스레드로 바꾸는 기능을 준비하고 있어요.',ready:false}]},
 {id:'research',label:'트렌드 분석',items:[
  {id:'trending-videos',label:'인기 영상 찾기',description:'인기 영상과 주제를 찾는 기능을 준비하고 있어요.',ready:false},
  {id:'research-keywords',label:'키워드·아이디어',description:'관심 주제와 아이디어를 모으는 기능을 준비하고 있어요.',ready:false}]},
 {id:'publishing',label:'배포 및 일정',items:[
  {id:'publishing-calendar',label:'발행 일정',description:'채널별 발행 일정을 관리하는 기능을 준비하고 있어요.',ready:false},
  {id:'publishing-channels',label:'채널 관리',description:'콘텐츠를 발행할 채널을 연결하고 관리하는 기능을 준비하고 있어요.',ready:false}]},
 {id:'analytics',label:'성과 분석',items:[
  {id:'analytics-overview',label:'콘텐츠 성과',description:'발행한 콘텐츠의 성과를 확인하는 기능을 준비하고 있어요.',ready:false}]},
 {id:'library',label:'콘텐츠 라이브러리',items:[
  {id:'brand-kit',label:'브랜드 키트',description:'브랜드 색상, 로고, 글꼴과 말투를 정해요.',ready:true},
  {id:'library-assets',label:'공통 소재',description:'여러 콘텐츠에 쓸 소재를 모으는 기능을 준비하고 있어요.',ready:false}]}
] as const satisfies readonly WorkspaceGroup[];
export type GroupId=typeof workspaceGroups[number]['id'];
export type WorkspaceId=typeof workspaceGroups[number]['items'][number]['id'];
export const defaultWorkspace:WorkspaceId='video-studio';
export function findWorkspace(id:WorkspaceId){
 for(const group of workspaceGroups){const item=group.items.find(item=>item.id===id);if(item)return {group,item};}
 throw new Error('알 수 없는 작업 공간');
}
export function toggleGroup(groups:readonly GroupId[],id:GroupId):GroupId[]{
 return groups.includes(id)?groups.filter(group=>group!==id):[...groups,id];
}
