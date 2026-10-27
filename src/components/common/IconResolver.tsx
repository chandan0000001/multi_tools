import React from 'react';
import * as LucideIcons from 'lucide-react';

interface IconResolverProps {
  name: string;
  className?: string;
}

export const IconResolver: React.FC<IconResolverProps> = ({ name, className = 'w-5 h-5' }) => {
  // @ts-ignore
  const IconComponent = LucideIcons[name] || LucideIcons.Wrench;
  return <IconComponent className={className} />;
};
