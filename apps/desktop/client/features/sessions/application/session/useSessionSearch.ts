import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChatSession } from '@/shared/types/chat';
import { searchSessionSummaries } from '@/infrastructure/persistence/sessionStore';

type UseSessionSearchOptions = {
  sessionSummaries: ChatSession[];
};

export const useSessionSearch = ({ sessionSummaries }: UseSessionSearchOptions) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchResult, setSearchResult] = useState<{
    query: string;
    sessions: ChatSession[];
  } | null>(null);
  const sessionSummariesRef = useRef(sessionSummaries);

  useEffect(() => {
    sessionSummariesRef.current = sessionSummaries;
  }, [sessionSummaries]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 160);

    return () => {
      window.clearTimeout(timer);
    };
  }, [searchQuery]);

  useEffect(() => {
    let cancelled = false;
    const query = debouncedQuery.trim();
    const queryLower = query.toLowerCase();

    if (!query) {
      return () => {
        cancelled = true;
      };
    }

    void searchSessionSummaries(query, 200)
      .then((results) => {
        if (!cancelled) {
          setSearchResult({ query, sessions: results });
        }
      })
      .catch((error) => {
        console.error('Failed to search sessions:', error);
        if (!cancelled) {
          setSearchResult({ query, sessions: [] });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const normalizedQuery = searchQuery.toLowerCase();
  const effectiveSearchResult = normalizedQuery ? searchResult : null;

  const filteredSessions = useMemo(() => {
    if (!normalizedQuery) {
      return sessionSummaries;
    }

    const matchingSearchResult =
      effectiveSearchResult && effectiveSearchResult.query.toLowerCase() === normalizedQuery
        ? effectiveSearchResult.sessions
        : null;

    if (!matchingSearchResult) {
      return sessionSummaries.filter((session) =>
        session.title.toLowerCase().includes(normalizedQuery)
      );
    }

    const sessionsById = new Map(sessionSummaries.map((session) => [session.id, session] as const));

    return matchingSearchResult.flatMap((session) => {
      const latestSession = sessionsById.get(session.id);
      return latestSession ? [latestSession] : [];
    });
  }, [effectiveSearchResult, normalizedQuery, sessionSummaries]);

  return {
    searchQuery,
    setSearchQuery,
    filteredSessions,
  };
};
