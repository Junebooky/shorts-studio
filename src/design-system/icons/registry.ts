import {ShortsArtwork,CardNewsArtwork,ThreadsArtwork} from './artwork/content';
import {TrendArtwork,CampaignArtwork} from './artwork/marketing';
import type {IconName} from './types';
export const iconRegistry={shorts:ShortsArtwork,'card-news':CardNewsArtwork,threads:ThreadsArtwork,trend:TrendArtwork,campaign:CampaignArtwork};
export const iconLabels:Record<IconName,string>={shorts:'숏츠','card-news':'카드뉴스',threads:'스레드',trend:'트렌드 분석',campaign:'캠페인'};
