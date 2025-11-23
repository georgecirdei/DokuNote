import Link from 'next/link';
import { FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  showText?: boolean;
  href?: string;
}

export function Logo({ className, showText = true, href = '/' }: LogoProps) {
  const content = (
    <div className={cn('flex items-center space-x-2', className)}>
      <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg">
        <FileText className="h-5 w-5 text-primary-foreground" />
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className="font-bold text-lg leading-none">DokuNote</span>
          <span className="text-xs text-muted-foreground">Documentation Platform</span>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="hover:opacity-80 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}

export function LogoIcon({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center w-8 h-8 bg-primary rounded-lg', className)}>
      <FileText className="h-5 w-5 text-primary-foreground" />
    </div>
  );
}
