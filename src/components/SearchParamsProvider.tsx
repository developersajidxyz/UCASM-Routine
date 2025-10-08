"use client";
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

interface SearchParamsProviderProps {
  children: (searchParams: URLSearchParams) => React.ReactNode;
}

export default function SearchParamsProvider({ children }: SearchParamsProviderProps) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchParamsWrapper>{children}</SearchParamsWrapper>
    </Suspense>
  );
}

function SearchParamsWrapper({ children }: SearchParamsProviderProps) {
  const searchParams = useSearchParams();
  return <>{children(searchParams)}</>;
}
