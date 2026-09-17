'use client';
import { useEffect, useRef } from 'react';
export function Reveal({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    el.classList.add('reveal-pending');
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { el.classList.remove('reveal-pending'); observer.disconnect(); } }, { threshold: 0.08 });
    observer.observe(el); return () => observer.disconnect();
  }, []);
  return <div className={`reveal ${className}`} ref={ref}>{children}</div>;
}
