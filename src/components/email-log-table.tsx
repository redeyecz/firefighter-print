"use client";

/**
 * Email Log Table Component
 * Displays paginated list of processed emails with status indicators
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { EmailLogEntry, JobStatus } from "@/types/dashboard";

function getStatusVariant(status: JobStatus): "default" | "destructive" | "secondary" {
  switch (status) {
    case "Printed":
      return "default"; // Green
    case "Failed":
      return "destructive"; // Red
    case "Processing":
      return "secondary"; // Gray
    default:
      return "secondary";
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString();
}

function truncateSubject(subject: string, maxLength: number = 50): string {
  if (subject.length <= maxLength) return subject;
  return subject.substring(0, maxLength) + "...";
}

interface EmailLogTableProps {
  jobs: EmailLogEntry[];
  onPreview?: (jobId: string) => void;
  onRetry?: (jobId: string) => void;
  onPrint?: (jobId: string) => void;
  retryingJobIds?: Set<string>;
}

export function EmailLogTable({
  jobs,
  onPreview,
  onRetry,
  onPrint,
  retryingJobIds,
}: EmailLogTableProps) {
  if (jobs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No emails processed yet</p>
        <p className="text-sm mt-2">Emails will appear here once they are processed</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Status</TableHead>
          <TableHead>Subject</TableHead>
          <TableHead>Date Received</TableHead>
          <TableHead>Date Printed</TableHead>
          <TableHead>Error</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {jobs.map((job) => (
          <TableRow key={job.id}>
            <TableCell>
              <Badge variant={getStatusVariant(job.status)}>{job.status}</Badge>
            </TableCell>
            <TableCell>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-help">{truncateSubject(job.subject)}</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{job.subject}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </TableCell>
            <TableCell>{formatDate(job.receivedDate)}</TableCell>
            <TableCell>{job.printedDate ? formatDate(job.printedDate) : "-"}</TableCell>
            <TableCell>
              {job.error ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-destructive cursor-help">Error</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{job.error}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                "-"
              )}
            </TableCell>
            <TableCell>
              <div className="flex gap-2">
                {onPreview && (
                  <Button variant="outline" size="sm" onClick={() => onPreview(job.id)}>
                    Preview
                  </Button>
                )}
                {onPrint && (
                  <Button variant="outline" size="sm" onClick={() => onPrint(job.id)}>
                    Print
                  </Button>
                )}
                {onRetry && job.status === "Failed" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRetry(job.id)}
                    disabled={retryingJobIds?.has(job.id)}
                  >
                    {retryingJobIds?.has(job.id) ? "Retrying..." : "Retry"}
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
