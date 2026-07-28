import React, { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InfiniteScrollProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  next: () => void;
  hasMore: boolean;
  isLoading: boolean;
  threshold?: number;
  loader?: React.ReactNode;
  endMessage?: React.ReactNode;
  className?: string;
}

export const InfiniteScroll: React.FC<InfiniteScrollProps> = ({
  children,
  next,
  hasMore,
  isLoading,
  threshold = 1.0,
  loader,
  endMessage,
  className,
  ...props
}) => {
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          next();
        }
      },
      { threshold }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMore, isLoading, next, threshold]);

  return (
    <div className={cn("w-full", className)} {...props}>
      {children}
      
      <div ref={observerTarget} className="h-4 w-full flex justify-center p-2 mt-2">
        {isLoading && (
          loader || <Loader2 className="h-6 w-6 animate-spin text-primary" />
        )}
        {!hasMore && !isLoading && endMessage}
      </div>
    </div>
  );
};
