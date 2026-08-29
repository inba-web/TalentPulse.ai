import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2 } from 'lucide-react';

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    STUDENTS: any[];
    COMPANIES: any[];
    USERS: any[];
    JOBS: any[];
  }>({ STUDENTS: [], COMPANIES: [], USERS: [], JOBS: [] });

  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  // Bind Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setResults({ STUDENTS: [], COMPANIES: [], USERS: [], JOBS: [] });
    }
  }, [open]);

  // Debounced search query
  useEffect(() => {
    if (query.trim().length === 0) {
      setResults({ STUDENTS: [], COMPANIES: [], USERS: [], JOBS: [] });
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const result = await response.json();
        if (result.success) {
          setResults(result.data);
        }
      } catch (err) {
        console.error('Search query failed:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const handleSelect = (type: string, id: string) => {
    setOpen(false);
    if (type === 'STUDENT') {
      navigate(`/students/${id}`);
    } else if (type === 'COMPANY') {
      navigate(`/companies/${id}`);
    } else if (type === 'JOB') {
      navigate(`/jobs/${id}`);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 pt-[10vh] bg-background/80 flex justify-center items-start">
      <div className="w-full max-w-2xl bg-surface-elevated border border-border-primary rounded shadow-2xl overflow-hidden flex flex-col max-h-[70vh]">

        {/* Search Input */}
        <div className="flex items-center px-4 border-b border-border-primary bg-surface-1">
          <Search className="w-5 h-5 text-text-muted" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 w-full h-14 px-3 text-sm bg-transparent border-0 outline-none text-text-primary placeholder-text-muted focus:ring-0"
            placeholder="Search students, companies, jobs, roll numbers... (Esc to close)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {loading && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
        </div>

        {/* Results Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {query.trim().length === 0 && (
            <div className="text-center py-8 text-text-muted text-sm font-medium">
              Start typing to search records...
            </div>
          )}

          {query.trim().length > 0 &&
            Object.keys(results).every((key) => results[key as keyof typeof results].length === 0) &&
            !loading && (
              <div className="text-center py-8 text-text-muted text-sm font-medium">
                No matching results found for "{query}".
              </div>
            )}

          {/* Group: Students */}
          {results.STUDENTS.length > 0 && (
            <div>
              <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 px-2">
                Students
              </div>
              <div className="space-y-1">
                {results.STUDENTS.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelect('STUDENT', item.id)}
                    className="w-full text-left px-3 py-2.5 rounded hover:bg-surface-2 border border-transparent hover:border-border-primary transition duration-150 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-sm font-semibold text-text-primary">{item.subtitle}</div>
                      <div className="text-xs text-text-muted">{item.title}</div>
                    </div>
                    <span className="text-[10px] font-bold bg-surface-3 text-text-secondary px-2 py-0.5 rounded">
                      {item.tag}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Group: Companies */}
          {results.COMPANIES.length > 0 && (
            <div>
              <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 px-2">
                Companies
              </div>
              <div className="space-y-1">
                {results.COMPANIES.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelect('COMPANY', item.id)}
                    className="w-full text-left px-3 py-2.5 rounded hover:bg-surface-2 border border-transparent hover:border-border-primary transition duration-150 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-sm font-semibold text-text-primary">{item.title}</div>
                      <div className="text-xs text-text-muted">{item.subtitle}</div>
                    </div>
                    <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded">
                      {item.tag}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Group: Jobs */}
          {results.JOBS.length > 0 && (
            <div>
              <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 px-2">
                Jobs
              </div>
              <div className="space-y-1">
                {results.JOBS.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelect('JOB', item.id)}
                    className="w-full text-left px-3 py-2.5 rounded hover:bg-surface-2 border border-transparent hover:border-border-primary transition duration-150 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-sm font-semibold text-text-primary">{item.title}</div>
                      <div className="text-xs text-text-muted">{item.subtitle}</div>
                    </div>
                    <span className="text-[10px] font-bold bg-warning/10 text-warning px-2 py-0.5 rounded">
                      {item.tag}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Group: Users */}
          {results.USERS.length > 0 && (
            <div>
              <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 px-2">
                System Staff
              </div>
              <div className="space-y-1">
                {results.USERS.map((item) => (
                  <div
                    key={item.id}
                    className="w-full px-3 py-2.5 rounded border border-transparent flex items-center justify-between"
                  >
                    <div>
                      <div className="text-sm font-semibold text-text-primary">{item.title}</div>
                      <div className="text-xs text-text-muted">{item.subtitle}</div>
                    </div>
                    <span className="text-[10px] font-bold bg-success/10 text-success px-2 py-0.5 rounded">
                      {item.tag}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border-primary bg-surface-1 flex justify-between items-center text-[10px] text-text-muted font-medium">
          <span>Search results matching query</span>
          <span>Press Esc to exit</span>
        </div>
      </div>
    </div>
  );
}
