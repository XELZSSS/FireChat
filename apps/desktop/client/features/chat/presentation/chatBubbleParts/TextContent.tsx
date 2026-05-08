import { memo } from 'react';

export const TextContent = memo(function TextContent({
  text,
  className,
  as = 'span',
}: {
  text: string;
  className?: string;
  as?: 'span' | 'p' | 'div';
}) {
  const Component = as;
  return <Component className={className}>{text}</Component>;
});
