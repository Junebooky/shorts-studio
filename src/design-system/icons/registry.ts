import {ShortsArtwork,CardNewsArtwork,ThreadsArtwork} from './artwork/content';
import type {IconName} from './types';
export const iconRegistry={shorts:ShortsArtwork,'card-news':CardNewsArtwork,threads:ThreadsArtwork};
export const iconLabels:Record<IconName,string>={shorts:'숏츠','card-news':'카드뉴스',threads:'스레드'};
