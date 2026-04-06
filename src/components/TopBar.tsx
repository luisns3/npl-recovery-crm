import { useState, useCallback } from 'react';
import { useCrm } from '../context/CrmContext';
import { useAuth } from '../context/AuthContext';
import { globalSearch } from '../lib/queries';

interface SearchResult {
  result_type: string;
  result_id: string;
  case_id: string;
  display_text: string;
  sub_text: string;
}

export default function TopBar() {
  const { openCase, openGroup } = useCrm();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    if (searchTimeout) clearTimeout(searchTimeout);
    if (term.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }
    const timeout = setTimeout(async () => {
      if (!user) return;
      const data = await globalSearch(term, user.tenant_id);
      setResults(data as SearchResult[]);
      setShowResults(true);
    }, 300);
    setSearchTimeout(timeout);
  }, [user, searchTimeout]);

  function handleResultClick(r: SearchResult) {
    setShowResults(false);
    setSearchTerm('');
    if (r.result_type === 'group') {
      openGroup(r.result_id);
    } else {
      openCase(r.case_id);
    }
  }

  return (
    <header className="h-14 bg-white border-b border-slate-200/50 px-6 flex items-center justify-between shrink-0 z-30">
      {/* Search */}
      <div className="relative w-80">
        <div className="flex items-center bg-slate-100 rounded-lg px-3 py-1.5 gap-2 focus-within:ring-2 ring-[#1a61a6]/20 transition-all">
          <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-slate-400 p-0"
            placeholder="Buscar expediente, deudor, grupo..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => results.length > 0 && setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
          />
        </div>
        {showResults && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-slate-200 max-h-80 overflow-y-auto z-50">
            {results.map((r, i) => (
              <button
                key={`${r.result_type}-${r.result_id}-${i}`}
                onClick={() => handleResultClick(r)}
                className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold uppercase text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                    {r.result_type}
                  </span>
                  <span className="text-sm font-medium text-slate-900">{r.display_text}</span>
                </div>
                {r.sub_text && <p className="text-xs text-slate-500 mt-0.5 ml-12">{r.sub_text}</p>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        <button className="p-2 hover:bg-slate-100 rounded-full transition-colors relative">
          <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        <button className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
    </header>
  );
}
