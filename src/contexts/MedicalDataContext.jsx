import React, { createContext, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const MedicalDataContext = createContext(null);

export function MedicalDataProvider({ children }) {
  const {
    data: articles = [],
    isLoading: loadingArticles,
    refetch: refetchArticles,
  } = useQuery({
    queryKey: ['medical-articles'],
    queryFn: () => base44.entities.Knowledge.filter({ category: 'pesquisa' }),
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: protocols = [],
    isLoading: loadingProtocols,
    refetch: refetchProtocols,
  } = useQuery({
    queryKey: ['medical-protocols'],
    queryFn: () => base44.entities.Knowledge.filter({ category: 'protocolo' }),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <MedicalDataContext.Provider value={{
      articles,
      loadingArticles,
      refetchArticles,
      protocols,
      loadingProtocols,
      refetchProtocols,
    }}>
      {children}
    </MedicalDataContext.Provider>
  );
}

export function useMedicalData() {
  const ctx = useContext(MedicalDataContext);
  if (!ctx) throw new Error('useMedicalData must be used within MedicalDataProvider');
  return ctx;
}