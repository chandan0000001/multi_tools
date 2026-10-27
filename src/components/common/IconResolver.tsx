import React from 'react';
import {
  FileText,
  Calculator,
  Image,
  QrCode,
  KeyRound,
  Type,
  Gauge,
  Globe,
  Clock,
  Braces,
  Binary,
  Link,
  Code,
  Hash,
  ShieldAlert,
  Fingerprint,
  FileCode,
  Search,
  Bot,
  Wrench,
  LucideIcon,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  FileText,
  Calculator,
  Image,
  QrCode,
  KeyRound,
  Type,
  Gauge,
  Globe,
  Clock,
  Braces,
  Binary,
  Link,
  Code,
  Hash,
  ShieldAlert,
  Fingerprint,
  FileCode,
  Search,
  Bot,
  Wrench,
};

interface IconResolverProps {
  name: string;
  className?: string;
}

export const IconResolver: React.FC<IconResolverProps> = ({ name, className = 'w-5 h-5' }) => {
  const IconComponent = ICON_MAP[name] || Wrench;
  return <IconComponent className={className} />;
};
