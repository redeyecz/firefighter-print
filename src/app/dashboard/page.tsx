"use client";

/**
 * Dashboard Page
 * Main admin dashboard for monitoring system status
 */

import { useState } from "react";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { EmailLogTable } from "@/components/email-log-table";
import { Pagination } from "@/components/pagination";
import { EmailPreviewModal } from "@/components/email-preview-modal";
import type { DashboardStats, SystemHealth, EmailLogResponse } from "@/types/dashboard";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function StatsCard({ title, value, loading }: { title: string; value: number; loading: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <div className="text-3xl font-bold">{value}</div>
        )}
      </CardContent>
    </Card>
  );
}

function ServiceStatusBadge({
  name,
  status,
  message,
  error,
}: {
  name: string;
  status: string;
  message?: string;
  error?: string;
}) {
  const variant =
    status === "healthy" ? "default" : status === "unhealthy" ? "destructive" : "secondary";

  const displayText = error || message || status;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={variant} className="cursor-help">
            {name}: {status}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{displayText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default function DashboardPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [previewJobId, setPreviewJobId] = useState<string | null>(null);
  const [retryingJobIds, setRetryingJobIds] = useState<Set<string>>(new Set());
  const limit = 50;

  const handlePrint = async (jobId: string) => {
    try {
      const response = await fetch(`/api/emails/${jobId}/print`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Print failed");
      }

      const result = await response.json();
      console.log(result.message);
      // TODO: Show success toast notification in future
    } catch (error) {
      console.error("Error printing:", error);
      // TODO: Show error toast notification in future
    }
  };

  const handleRetry = async (jobId: string) => {
    // Prevent concurrent retries
    if (retryingJobIds.has(jobId)) {
      return;
    }

    setRetryingJobIds((prev) => new Set(prev).add(jobId));

    try {
      const response = await fetch(`/api/emails/${jobId}/retry`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Retry failed");
      }

      const result = await response.json();
      console.log(result.message);
      // TODO: Show success toast notification in future

      // Trigger SWR to refetch the email log
      // This will update the job status in the table
    } catch (error) {
      console.error("Error retrying job:", error);
      // TODO: Show error toast notification in future
    } finally {
      setRetryingJobIds((prev) => {
        const next = new Set(prev);
        next.delete(jobId);
        return next;
      });
    }
  };

  const { data: stats, isLoading: statsLoading } = useSWR<DashboardStats>(
    "/api/dashboard/stats",
    fetcher,
    {
      refreshInterval: 30000, // Poll every 30 seconds
    }
  );

  const { data: health, isLoading: healthLoading } = useSWR<SystemHealth>(
    "/api/dashboard/health",
    fetcher,
    {
      refreshInterval: 30000, // Poll every 30 seconds
    }
  );

  const {
    data: emailLog,
    isLoading: emailLogLoading,
    error: emailLogError,
  } = useSWR<EmailLogResponse>(`/api/emails?page=${currentPage}&limit=${limit}`, fetcher, {
    refreshInterval: 30000, // Poll every 30 seconds
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Firefighter Dispatch System</h1>
        <p className="text-muted-foreground">Monitor system status and dispatch processing</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard title="Total (24h)" value={stats?.total ?? 0} loading={statsLoading} />
        <StatsCard title="Successful" value={stats?.successful ?? 0} loading={statsLoading} />
        <StatsCard title="Failed" value={stats?.failed ?? 0} loading={statsLoading} />
        <StatsCard
          title="Success Rate"
          value={stats?.successRate ? Math.round(stats.successRate * 100) : 0}
          loading={statsLoading}
        />
      </div>

      {/* Service Health Status */}
      <Card>
        <CardHeader>
          <CardTitle>Service Health</CardTitle>
        </CardHeader>
        <CardContent>
          {healthLoading ? (
            <div className="flex gap-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-6 w-32" />
            </div>
          ) : health ? (
            <div className="flex flex-wrap gap-2">
              <ServiceStatusBadge
                name="Email"
                status={health.emailService.status}
                message={health.emailService.message}
                error={health.emailService.error}
              />
              <ServiceStatusBadge
                name="Map"
                status={health.mapService.status}
                message={health.mapService.message}
                error={health.mapService.error}
              />
              <ServiceStatusBadge
                name="Printer"
                status={health.printerService.status}
                message={health.printerService.message}
                error={health.printerService.error}
              />
              <span className="text-sm text-muted-foreground ml-auto">
                Last updated: {new Date(health.lastUpdated).toLocaleTimeString()}
              </span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Unable to load service health</p>
          )}
        </CardContent>
      </Card>

      {/* Email Processing Log */}
      <Card>
        <CardHeader>
          <CardTitle>Email Processing Log</CardTitle>
        </CardHeader>
        <CardContent>
          {emailLogLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : emailLogError ? (
            <p className="text-sm text-destructive">
              Failed to load email log. Please try again later.
            </p>
          ) : (
            <>
              <EmailLogTable
                jobs={emailLog?.jobs ?? []}
                onPreview={(jobId) => {
                  setPreviewJobId(jobId);
                }}
                onPrint={handlePrint}
                onRetry={handleRetry}
                retryingJobIds={retryingJobIds}
              />
              <Pagination
                currentPage={currentPage}
                totalPages={emailLog?.totalPages ?? 0}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </CardContent>
      </Card>

      <EmailPreviewModal
        jobId={previewJobId}
        isOpen={previewJobId !== null}
        onClose={() => setPreviewJobId(null)}
      />
    </div>
  );
}
