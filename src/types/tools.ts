export type ToolAudience = 'normalUser' | 'developers';

export type PrivacyClassification = 'local' | 'network' | 'hybrid';

export interface ToolMetadata {
  id: string;
  title: string;
  shortDesc: string;
  category: string;
  audience: ToolAudience;
  route: string;
  privacy: PrivacyClassification;
  privacyNotice: string;
  iconName: string;
  badge?: string;
  keywords: string[];
  beforeYouUse?: string;
  bestFor?: string[];
  limitations?: string[];
  networkDisclosure?: string;
  cacheable?: boolean;
}

export type NormalCategory =
  | 'All'
  | 'Math'
  | 'Files'
  | 'Images'
  | 'Generate'
  | 'Text'
  | 'Network'
  | 'Time'
  | 'Security';

export type DeveloperCategory =
  | 'All'
  | 'Formatters'
  | 'Encoders/Converters'
  | 'Security'
  | 'Generators'
  | 'Web/SEO'
  | 'Text';
