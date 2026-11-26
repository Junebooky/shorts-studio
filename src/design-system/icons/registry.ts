import {ShortsArtwork,CardNewsArtwork,ThreadsArtwork} from './artwork/content';
import {TrendArtwork,CampaignArtwork} from './artwork/marketing';
import {HomeArtwork,CalendarArtwork,AnalyticsArtwork,LibraryArtwork} from './artwork/navigation';
import {QuickPlayArtwork} from './artwork/creation';
import {ComingSoonArtwork} from './artwork/status';
import type {IconName} from './types';
export const iconRegistry={shorts:ShortsArtwork,'card-news':CardNewsArtwork,threads:ThreadsArtwork,trend:TrendArtwork,campaign:CampaignArtwork,home:HomeArtwork,calendar:CalendarArtwork,analytics:AnalyticsArtwork,library:LibraryArtwork,'quick-play':QuickPlayArtwork,'coming-soon':ComingSoonArtwork};
export const iconLabels:Record<IconName,string>={shorts:'숏츠','card-news':'카드뉴스',threads:'스레드',trend:'트렌드 분석',campaign:'캠페인',home:'마케팅 홈',calendar:'배포 및 일정',analytics:'성과 분석',library:'콘텐츠 라이브러리','quick-play':'새 영상 만들기','coming-soon':'준비 중'};
