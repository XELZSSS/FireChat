import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { t } from '@/shared/utils/i18n';
import type { RequestLogQuery, RequestLogRecord } from '@contracts/request-log';
import {
  clearDesktopRequestLogs,
  queryDesktopRequestLogs,
} from '@client/features/desktop-shell/infrastructure/nativeDesktop';
import RequestLogDetails from '@client/features/settings/presentation/settingsModal/requestLogsTab/RequestLogDetails';
import RequestLogFilters from '@client/features/settings/presentation/settingsModal/requestLogsTab/RequestLogFilters';
import RequestLogList from '@client/features/settings/presentation/settingsModal/requestLogsTab/RequestLogList';
import {
  buildProviderFilterOptions,
  buildResultFilterOptions,
} from '@client/features/settings/presentation/settingsModal/requestLogsTab/formatters';
import type {
  RequestLogsTabProps,
  RequestLogStatusFilter,
} from '@client/features/settings/presentation/settingsModal/requestLogsTab/types';

const RequestLogsTab = ({ mutationsLockedReason = null }: RequestLogsTabProps) => {
  const [providerFilter, setProviderFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<RequestLogStatusFilter>('all');
  const [keyword, setKeyword] = useState('');
  const [items, setItems] = useState<RequestLogRecord[]>([]);
  const [providerItems, setProviderItems] = useState<RequestLogRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const loadSequenceRef = useRef(0);

  const loadLogs = useCallback(async () => {
    const loadSequence = loadSequenceRef.current + 1;
    loadSequenceRef.current = loadSequence;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const query: RequestLogQuery = {
        providerId: providerFilter !== 'all' ? providerFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        keyword: keyword.trim() || undefined,
        limit: 200,
      };
      const [result, providerResult] = await Promise.all([
        queryDesktopRequestLogs(query),
        queryDesktopRequestLogs({ limit: 500 }),
      ]);

      if (loadSequenceRef.current !== loadSequence) {
        return;
      }

      setItems(result.items);
      setProviderItems(providerResult.items);
      setTotal(result.total);
      setSelectedLogId((current) =>
        result.items.some((item) => item.id === current) ? current : (result.items[0]?.id ?? null)
      );
    } catch (error) {
      if (loadSequenceRef.current !== loadSequence) {
        return;
      }

      console.error('Failed to load request logs:', error);
      setItems([]);
      setTotal(0);
      setSelectedLogId(null);
      setErrorMessage(t('settings.requestLogs.loadFailed'));
    } finally {
      if (loadSequenceRef.current === loadSequence) {
        setIsLoading(false);
      }
    }
  }, [keyword, providerFilter, statusFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadLogs();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadLogs]);

  const handleClear = useCallback(async () => {
    if (mutationsLockedReason) {
      return;
    }

    try {
      await clearDesktopRequestLogs();
      setItems([]);
      setProviderItems([]);
      setTotal(0);
      setSelectedLogId(null);
      setProviderFilter('all');
      setErrorMessage(null);
    } catch (error) {
      console.error('Failed to clear request logs:', error);
      setErrorMessage(t('settings.requestLogs.clearFailed'));
    }
  }, [mutationsLockedReason]);

  const providerOptions = useMemo(() => buildProviderFilterOptions(providerItems), [providerItems]);
  const resultFilterOptions = useMemo(() => buildResultFilterOptions(), []);
  const selectedLog = useMemo(
    () => items.find((item) => item.id === selectedLogId) ?? null,
    [items, selectedLogId]
  );

  return (
    <div className="space-y-5">
      <RequestLogFilters
        providerFilter={providerFilter}
        statusFilter={statusFilter}
        keyword={keyword}
        providerOptions={providerOptions}
        resultFilterOptions={resultFilterOptions}
        isLoading={isLoading}
        canClear={items.length > 0}
        total={total}
        errorMessage={errorMessage}
        mutationsLockedReason={mutationsLockedReason}
        onProviderFilterChange={setProviderFilter}
        onStatusFilterChange={setStatusFilter}
        onKeywordChange={setKeyword}
        onRefresh={() => void loadLogs()}
        onClear={() => void handleClear()}
      />

      <RequestLogList
        items={items}
        selectedLogId={selectedLogId}
        isLoading={isLoading}
        onSelectLog={setSelectedLogId}
      />

      <RequestLogDetails selectedLog={selectedLog} />
    </div>
  );
};

export default RequestLogsTab;
