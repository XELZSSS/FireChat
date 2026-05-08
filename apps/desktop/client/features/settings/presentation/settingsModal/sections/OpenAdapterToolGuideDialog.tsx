import { memo } from 'react';
import { t } from '@/shared/utils/i18n';
import { Button, Modal } from '@/shared/ui';

const OPENADAPTER_TOOL_GUIDE_ITEMS = [
  {
    titleKey: 'settings.modal.openadapterTools.webSearch.title',
    descriptionKey: 'settings.modal.openadapterTools.webSearch.description',
    endpoint: 'POST /v1/tools/search',
    params: ['query*', 'num_results', 'language', 'time_range'],
  },
  {
    titleKey: 'settings.modal.openadapterTools.imageSearch.title',
    descriptionKey: 'settings.modal.openadapterTools.imageSearch.description',
    endpoint: 'POST /v1/tools/search/images',
    params: ['query*', 'num_results'],
  },
  {
    titleKey: 'settings.modal.openadapterTools.newsSearch.title',
    descriptionKey: 'settings.modal.openadapterTools.newsSearch.description',
    endpoint: 'POST /v1/tools/search/news',
    params: ['query*', 'num_results', 'time_range'],
  },
  {
    titleKey: 'settings.modal.openadapterTools.videoSearch.title',
    descriptionKey: 'settings.modal.openadapterTools.videoSearch.description',
    endpoint: 'POST /v1/tools/search/videos',
    params: ['query*', 'num_results'],
  },
  {
    titleKey: 'settings.modal.openadapterTools.scrapeUrl.title',
    descriptionKey: 'settings.modal.openadapterTools.scrapeUrl.description',
    endpoint: 'POST /v1/tools/scrape',
    params: ['url*', 'mode', 'extract_links', 'extract_images', 'extract_meta'],
  },
  {
    titleKey: 'settings.modal.openadapterTools.pageToMarkdown.title',
    descriptionKey: 'settings.modal.openadapterTools.pageToMarkdown.description',
    endpoint: 'POST /v1/tools/scrape/markdown',
    params: ['url*', 'mode'],
  },
  {
    titleKey: 'settings.modal.openadapterTools.crawlSite.title',
    descriptionKey: 'settings.modal.openadapterTools.crawlSite.description',
    endpoint: 'POST /v1/tools/crawl',
    params: ['url*', 'max_pages', 'max_depth', 'same_domain'],
  },
] as const;

type OpenAdapterToolGuideDialogProps = {
  isOpen: boolean;
  onClose: () => void;
};

const OpenAdapterToolGuideDialogBase = ({ isOpen, onClose }: OpenAdapterToolGuideDialogProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    <Modal
      isOpen
      title={t('settings.modal.openadapterTools.guide.title')}
      className="z-[91] max-h-[92vh] max-w-[min(52rem,calc(100vw-2rem))]"
      overlayClassName="z-[90]"
      onClose={onClose}
      ariaDescribedBy={false}
    >
      <div className="flex max-h-[92vh] flex-col">
        <div className="border-b border-[var(--line-1)] px-5 py-4">
          <div className="text-base font-semibold text-[var(--ink-1)]">
            {t('settings.modal.openadapterTools.guide.title')}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div className="space-y-4">
            <div className="grid gap-3 grid-cols-2">
              <div className="border border-[var(--line-1)] bg-[var(--bg-2)]/70 p-3">
                <div className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--ink-3)]">
                  {t('settings.modal.openadapterTools.guide.baseUrlLabel')}
                </div>
                <div className="mt-2 font-mono text-sm text-[var(--ink-1)]">
                  https://api.openadapter.in
                </div>
              </div>
              <div className="border border-[var(--line-1)] bg-[var(--bg-2)]/70 p-3">
                <div className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--ink-3)]">
                  {t('settings.modal.openadapterTools.guide.authLabel')}
                </div>
                <div className="mt-2 font-mono text-sm text-[var(--ink-1)]">
                  Authorization: Bearer {'<'}OpenAdapter API Key{'>'}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {OPENADAPTER_TOOL_GUIDE_ITEMS.map((item) => (
                <div
                  key={item.endpoint}
                  className="space-y-2 border border-[var(--line-1)] bg-[var(--bg-2)]/45 p-3"
                >
                  <div className="space-y-1">
                    <div className="text-sm font-semibold text-[var(--ink-1)]">
                      {t(item.titleKey)}
                    </div>
                    <div className="text-xs leading-5 text-[var(--ink-3)]">
                      {t(item.descriptionKey)}
                    </div>
                  </div>

                  <div className="space-y-1.5 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[var(--ink-3)]">
                        {t('settings.modal.openadapterTools.guide.endpointLabel')}
                      </span>
                      <code className="rounded bg-[var(--bg-3)] px-2 py-1 font-mono text-[12px] text-[var(--ink-1)]">
                        {item.endpoint}
                      </code>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[var(--ink-3)]">
                        {t('settings.modal.openadapterTools.guide.paramsLabel')}
                      </span>
                      {item.params.map((param) => (
                        <code
                          key={param}
                          className="rounded bg-[var(--bg-3)] px-2 py-1 font-mono text-[12px] text-[var(--ink-1)]"
                        >
                          {param}
                        </code>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[var(--line-1)] px-5 py-4">
          <a
            href="https://dashboard.openadapter.in/tools"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[var(--action-interactive)] underline-offset-4 transition-colors hover:text-[var(--action-interactive-hover)] hover:underline"
          >
            {t('settings.modal.openadapterTools.guide.source')}
          </a>
          <Button variant="subtle" size="sm" onClick={onClose}>
            {t('settings.modal.cancel')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

const OpenAdapterToolGuideDialog = memo(OpenAdapterToolGuideDialogBase);
export default OpenAdapterToolGuideDialog;
