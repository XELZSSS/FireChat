import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import type { ChatAttachment } from '@/shared/types/chat';
import { isStructuredDocumentFileLike } from '@/shared/utils/chatAttachments';
import {
  buildAttachmentSelectionResult,
  combineAttachmentNotices,
  createPendingStructuredAttachment,
  partitionAttachmentFilesByUploadSupport,
  type PendingStructuredAttachment,
} from '@client/features/chat/presentation/input/chatInputAttachmentHelpers';

export const useChatInputAttachments = () => {
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [attachmentNotice, setAttachmentNotice] = useState<string | null>(null);
  const [rejectedAttachmentMessages, setRejectedAttachmentMessages] = useState<string[]>([]);
  const [pendingStructuredAttachments, setPendingStructuredAttachments] = useState<
    PendingStructuredAttachment[]
  >([]);
  const [pendingStructuredNotice, setPendingStructuredNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectionVersionRef = useRef(0);
  const attachmentsRef = useRef<ChatAttachment[]>([]);
  const deferredStructuredAttachmentsRef = useRef<PendingStructuredAttachment[]>([]);

  useEffect(() => {
    attachmentsRef.current = attachments;
  }, [attachments]);

  const resetFileInput = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const invalidateSelection = useCallback((): number => {
    selectionVersionRef.current += 1;
    return selectionVersionRef.current;
  }, []);

  const isSelectionCurrent = useCallback((version: number): boolean => {
    return selectionVersionRef.current === version;
  }, []);

  const closeParseDialog = useCallback(() => {
    invalidateSelection();
    setPendingStructuredAttachments([]);
    setPendingStructuredNotice(null);
  }, [invalidateSelection]);

  const openFilePicker = useCallback(() => {
    setAttachmentNotice(null);
    fileInputRef.current?.click();
  }, []);

  const removeAttachment = useCallback(
    (attachmentId: string) => {
      invalidateSelection();
      setAttachments((current) => current.filter((attachment) => attachment.id !== attachmentId));
    },
    [invalidateSelection]
  );

  const clearAttachmentNotice = useCallback(() => {
    setAttachmentNotice(null);
  }, []);

  const closeRejectedAttachmentDialog = useCallback(() => {
    const deferredStructuredAttachments = deferredStructuredAttachmentsRef.current;
    deferredStructuredAttachmentsRef.current = [];
    setRejectedAttachmentMessages([]);

    if (deferredStructuredAttachments.length > 0) {
      setPendingStructuredAttachments(deferredStructuredAttachments);
    }
  }, []);

  const clearAttachments = useCallback(() => {
    invalidateSelection();
    deferredStructuredAttachmentsRef.current = [];
    setAttachments([]);
    clearAttachmentNotice();
    closeRejectedAttachmentDialog();
    closeParseDialog();
    resetFileInput();
  }, [
    clearAttachmentNotice,
    closeParseDialog,
    closeRejectedAttachmentDialog,
    invalidateSelection,
    resetFileInput,
  ]);

  const appendFiles = useCallback(
    async (selectedFiles: File[]) => {
      if (selectedFiles.length === 0) {
        return;
      }

      deferredStructuredAttachmentsRef.current = [];
      const { acceptedFiles, rejectedMessages } =
        partitionAttachmentFilesByUploadSupport(selectedFiles);

      if (rejectedMessages.length > 0) {
        setRejectedAttachmentMessages(rejectedMessages);
      }

      if (acceptedFiles.length === 0) {
        return;
      }

      const directFiles = acceptedFiles.filter((file) => !isStructuredDocumentFileLike(file));
      const structuredFiles = acceptedFiles.filter((file) => isStructuredDocumentFileLike(file));

      let baseAttachments = attachmentsRef.current;
      let baseNotice: string | null = null;

      if (directFiles.length > 0) {
        const version = invalidateSelection();
        const result = await buildAttachmentSelectionResult({
          existingAttachments: attachmentsRef.current,
          selectedFiles: directFiles,
          version,
          isSelectionCurrent,
        });

        if (!result) {
          return;
        }

        baseAttachments = result.attachments;
        baseNotice = result.notice;
        setAttachments(result.attachments);
        setAttachmentNotice(result.notice);
      }

      if (structuredFiles.length > 0) {
        attachmentsRef.current = baseAttachments;
        setPendingStructuredNotice(baseNotice);
        const nextPendingStructuredAttachments = structuredFiles.map(
          createPendingStructuredAttachment
        );

        if (rejectedMessages.length > 0) {
          deferredStructuredAttachmentsRef.current = nextPendingStructuredAttachments;
        } else {
          setPendingStructuredAttachments(nextPendingStructuredAttachments);
        }
      }
    },
    [invalidateSelection, isSelectionCurrent]
  );

  const updatePendingStructuredAttachment = useCallback(
    (attachmentId: string, updates: { pageRange?: string }) => {
      setPendingStructuredAttachments((current) =>
        current.map((attachment) =>
          attachment.id === attachmentId
            ? {
                ...attachment,
                ...(updates.pageRange !== undefined ? { pageRange: updates.pageRange } : {}),
              }
            : attachment
        )
      );
    },
    []
  );

  const confirmStructuredAttachmentParsing = useCallback(async () => {
    if (pendingStructuredAttachments.length === 0) {
      closeParseDialog();
      return;
    }

    const pendingAttachmentsSnapshot = pendingStructuredAttachments.map((attachment) => ({
      ...attachment,
    }));
    const optionsByFile = new Map(
      pendingAttachmentsSnapshot.map((attachment) => [attachment.file, attachment])
    );
    const version = invalidateSelection();
    const result = await buildAttachmentSelectionResult({
      existingAttachments: attachmentsRef.current,
      selectedFiles: pendingAttachmentsSnapshot.map((attachment) => attachment.file),
      version,
      isSelectionCurrent,
      resolveStructuredDocumentOptions: (file) => {
        const config = optionsByFile.get(file);
        return config
          ? {
              pageRange: config.pageRange.trim() || undefined,
            }
          : undefined;
      },
    });

    if (!result) {
      return;
    }

    setAttachments(result.attachments);
    setAttachmentNotice(combineAttachmentNotices(pendingStructuredNotice, result.notice));
    closeParseDialog();
  }, [
    closeParseDialog,
    invalidateSelection,
    isSelectionCurrent,
    pendingStructuredAttachments,
    pendingStructuredNotice,
  ]);

  const handleFileInputChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(event.target.files ?? []);
      event.target.value = '';
      await appendFiles(selectedFiles);
    },
    [appendFiles]
  );

  return {
    attachments,
    appendFiles,
    attachmentNotice,
    clearAttachments,
    closeRejectedAttachmentDialog,
    confirmStructuredAttachmentParsing,
    fileInputRef,
    handleFileInputChange,
    isParseDialogOpen: pendingStructuredAttachments.length > 0,
    isRejectedAttachmentDialogOpen: rejectedAttachmentMessages.length > 0,
    openFilePicker,
    pendingStructuredAttachments,
    rejectedAttachmentMessages,
    removeAttachment,
    closeParseDialog,
    updatePendingStructuredAttachment,
  };
};

