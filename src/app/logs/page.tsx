"use client";

/**
 * Logs Page
 * System logs viewer with filtering
 */

import { useState } from "react";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LogEntry, LogLevel } from "@/lib/logger";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function getLevelVariant(level: LogLevel): "default" | "destructive" | "secondary" {
  switch (level) {
    case LogLevel.ERROR:
      return "destructive";
    case LogLevel.WARN:
      return "secondary";
    default:
      return "default";
  }
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString();
}

interface LogsResponse {
  logs: LogEntry[];
  total: number;
}

export default function LogsPage() {
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [filterJobId, setFilterJobId] = useState<string>("");
  const [limit, setLimit] = useState<number>(100);

  // Build query string
  const queryParams = new URLSearchParams();
  queryParams.set("limit", limit.toString());
  if (filterLevel !== "all") {
    queryParams.set("level", filterLevel);
  }
  if (filterJobId) {
    queryParams.set("jobId", filterJobId);
  }

  const { data, isLoading, mutate } = useSWR<LogsResponse>(
    `/api/logs?${queryParams.toString()}`,
    fetcher,
    {
      refreshInterval: 5000, // Refresh every 5 seconds
    }
  );

  const handleRefresh = () => {
    mutate();
  };

  const handleClearFilters = () => {
    setFilterLevel("all");
    setFilterJobId("");
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Logs</h1>
        <p className="text-muted-foreground">View and filter system activity logs</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="level-filter">Log Level</Label>
              <Select value={filterLevel} onValueChange={setFilterLevel}>
                <SelectTrigger id="level-filter">
                  <SelectValue placeholder="All levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="debug">Debug</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warn">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="job-filter">Job ID</Label>
              <Input
                id="job-filter"
                placeholder="Filter by job ID"
                value={filterJobId}
                onChange={(e) => setFilterJobId(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="limit">Show Last</Label>
              <Select value={limit.toString()} onValueChange={(v) => setLimit(parseInt(v))}>
                <SelectTrigger id="limit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50">50 entries</SelectItem>
                  <SelectItem value="100">100 entries</SelectItem>
                  <SelectItem value="250">250 entries</SelectItem>
                  <SelectItem value="500">500 entries</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 flex items-end gap-2">
              <Button onClick={handleClearFilters} variant="outline">
                Clear Filters
              </Button>
              <Button onClick={handleRefresh} variant="outline">
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Display */}
      <Card>
        <CardHeader>
          <CardTitle>Log Entries {data && `(${data.total})`}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : !data || data.logs.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No log entries found</p>
          ) : (
            <div className="space-y-2">
              {data.logs.map((log, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-2 font-mono text-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={getLevelVariant(log.level)}>{log.level.toUpperCase()}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(log.timestamp)}
                      </span>
                    </div>
                    {log.context?.jobId && (
                      <Badge variant="outline">Job: {log.context.jobId}</Badge>
                    )}
                  </div>

                  <div className="text-foreground">{log.message}</div>

                  {log.context && Object.keys(log.context).length > 0 && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                        Context
                      </summary>
                      <pre className="mt-2 p-2 bg-muted rounded overflow-x-auto">
                        {JSON.stringify(log.context, null, 2)}
                      </pre>
                    </details>
                  )}

                  {log.error && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-destructive hover:text-destructive/80">
                        Error Details
                      </summary>
                      <div className="mt-2 p-2 bg-destructive/10 rounded">
                        <div className="font-semibold">{log.error.message}</div>
                        {log.error.code && (
                          <div className="text-muted-foreground">Code: {log.error.code}</div>
                        )}
                        {log.error.stack && (
                          <pre className="mt-2 text-xs overflow-x-auto whitespace-pre-wrap">
                            {log.error.stack}
                          </pre>
                        )}
                      </div>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
