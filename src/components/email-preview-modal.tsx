"use client";

/**
 * Email Preview Modal Component
 * Displays original email HTML and final printed output in tabs
 */

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

interface EmailPreviewModalProps {
  jobId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

interface PreviewData {
  originalHtml: string;
  finalHtml: string;
}

export function EmailPreviewModal({ jobId, isOpen, onClose }: EmailPreviewModalProps) {
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !jobId) {
      setPreviewData(null);
      setError(null);
      return;
    }

    const fetchPreviewData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [originalResponse, outputResponse] = await Promise.all([
          fetch(`/api/emails/${jobId}/original`),
          fetch(`/api/emails/${jobId}/output`),
        ]);

        if (!originalResponse.ok || !outputResponse.ok) {
          throw new Error("Failed to fetch preview data");
        }

        const originalData = await originalResponse.json();
        const outputData = await outputResponse.json();

        setPreviewData({
          originalHtml: originalData.html,
          finalHtml: outputData.html,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreviewData();
  }, [jobId, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Email Preview</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : error ? (
          <div className="text-destructive text-sm">Error loading preview: {error}</div>
        ) : previewData ? (
          <Tabs defaultValue="original" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="original">Original Email</TabsTrigger>
              <TabsTrigger value="final">Final Output</TabsTrigger>
            </TabsList>
            <TabsContent value="original" className="flex-1 overflow-auto">
              <iframe
                srcDoc={previewData.originalHtml}
                className="w-full h-full border rounded"
                title="Original Email"
                sandbox="allow-same-origin"
              />
            </TabsContent>
            <TabsContent value="final" className="flex-1 overflow-auto">
              <iframe
                srcDoc={previewData.finalHtml}
                className="w-full h-full border rounded"
                title="Final Output"
                sandbox="allow-same-origin"
              />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-muted-foreground text-sm">No preview data available</div>
        )}
      </DialogContent>
    </Dialog>
  );
}
