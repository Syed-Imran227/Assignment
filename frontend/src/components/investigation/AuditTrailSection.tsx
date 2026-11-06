import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { History, Filter, User, Cpu, ShieldCheck } from 'lucide-react';

export const AuditTrailSection: React.FC = () => {
  const invId = useSelector((state: RootState) => state.workspace.id);
  const [logs, setLogs] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'human' | 'ai'>('all');
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    if (!invId) return;
    setLoading(true);
    try {
      const url = filter === 'all'
        ? `/api/investigations/${invId}/audit`
        : `/api/investigations/${invId}/audit?actor_type=${filter}`;
      const res = await fetch(url);
      if (res.ok) {
        setLogs(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [invId, filter]);

  return (
    <div className="p-4 bg-sheet rounded-sm border border-rule text-xs font-sans">
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-rule-subtle">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-slate-blue" />
          <span className="font-serif text-sm font-medium text-ink">
            Immutable ALCOA+ Audit Trail
          </span>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-1 font-mono text-[11px]">
          <span className="text-graphite-light mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filter:
          </span>
          {(['all', 'human', 'ai'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFilter(type)}
              className={`px-2 py-0.5 rounded-sm capitalize transition-colors ${
                filter === type
                  ? 'bg-ink text-sheet'
                  : 'bg-paper text-graphite hover:text-ink border border-rule'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="p-4 text-center text-graphite-light italic font-mono text-[11px]">
          No audit entries recorded yet.
        </div>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {logs.map((log) => (
            <div
              key={log.id}
              className="p-2.5 rounded-sm bg-paper border border-rule-subtle flex items-start justify-between gap-3"
            >
              <div className="flex items-start gap-2">
                <div className="mt-0.5">
                  {log.actor_type === 'human' ? (
                    <User className="w-3.5 h-3.5 text-verdigris" />
                  ) : (
                    <Cpu className="w-3.5 h-3.5 text-slate-blue" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-ink text-[11.5px]">
                      {log.actor_label}
                    </span>
                    <span className="font-mono text-[10px] uppercase px-1 py-0.2 bg-sheet border border-rule rounded-sm text-graphite">
                      {log.action}
                    </span>
                  </div>
                  {log.after_state && (
                    <div className="font-mono text-[10.5px] text-graphite mt-1 truncate max-w-md">
                      Payload: {JSON.stringify(log.after_state)}
                    </div>
                  )}
                </div>
              </div>

              <span className="font-mono text-[10.5px] text-graphite-light flex-shrink-0">
                {log.created_at ? new Date(log.created_at).toLocaleTimeString() : ''}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

