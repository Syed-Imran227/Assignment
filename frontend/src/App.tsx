import React, { useState, useEffect } from 'react';
import { InvestigationsListPage } from './pages/InvestigationsListPage';
import { WorkspacePage } from './pages/WorkspacePage';

export const App: React.FC = () => {
  const [activeInvestigationId, setActiveInvestigationId] = useState<string | null>(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#/workspace/')) {
      return hash.replace('#/workspace/', '');
    }
    return null;
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/workspace/')) {
        setActiveInvestigationId(hash.replace('#/workspace/', ''));
      } else {
        setActiveInvestigationId(null);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const openInvestigation = (id: string) => {
    setActiveInvestigationId(id);
    window.location.hash = `#/workspace/${id}`;
  };

  const backToList = () => {
    setActiveInvestigationId(null);
    window.location.hash = '#/';
  };

  if (activeInvestigationId) {
    return (
      <WorkspacePage
        investigationId={activeInvestigationId}
        onBackToList={backToList}
      />
    );
  }

  return <InvestigationsListPage onOpenInvestigation={openInvestigation} />;
};

export default App;

