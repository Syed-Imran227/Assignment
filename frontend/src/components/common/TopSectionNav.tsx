import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

export const TopSectionNav: React.FC = () => {
  const sections = [
    { id: 'section-01', num: '01', label: 'Details' },
    { id: 'section-02', num: '02', label: 'Containment' },
    { id: 'section-03', num: '03', label: 'Risk' },
    { id: 'section-04', num: '04', label: '5 Whys / Fishbone' },
    { id: 'section-05', num: '05', label: 'Evidence' },
    { id: 'section-06', num: '06', label: 'CAPA' },
    { id: 'section-07', num: '07', label: 'Attestation' },
    { id: 'section-08', num: '08', label: 'Audit' },
  ];

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="sticky top-0 z-20 bg-paper/95 backdrop-blur-sm border-b border-rule px-6 py-2 flex items-center justify-between text-xs font-mono">
      <div className="flex items-center gap-1 overflow-x-auto pr-2">
        {sections.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => scrollTo(s.id)}
            className="px-2 py-1 rounded-sm text-graphite hover:text-ink hover:bg-sheet border border-transparent hover:border-rule transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
          >
            <span className="font-bold text-slate-blue">{s.num}</span>
            <span>{s.label}</span>
          </button>
        ))}
      </div>

      <div className="text-[11px] text-graphite-light font-mono hidden md:block">
        [Alt+1..8 to jump]
      </div>
    </div>
  );
};

