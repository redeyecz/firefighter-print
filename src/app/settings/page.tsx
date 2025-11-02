"use client";

/**
 * Settings Page
 * Configuration interface for system settings
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import type { SystemConfig, ConfigValidationError } from "@/types/config";

export default function SettingsPage() {
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<ConfigValidationError[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch("/api/config");
        if (!response.ok) {
          throw new Error("Failed to fetch configuration");
        }
        const data = await response.json();
        setConfig(data);
      } catch (error) {
        console.error("Error fetching configuration:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfig();
  }, []);

  const handleSave = async () => {
    if (!config) return;

    setIsSaving(true);
    setErrors([]);
    setSaveSuccess(false);

    try {
      const response = await fetch("/api/config", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          setErrors(data.errors);
        }
        throw new Error(data.error || "Failed to save configuration");
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving configuration:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const getFieldError = (field: string): string | undefined => {
    return errors.find((e) => e.field === field)?.message;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">System Configuration</h1>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">System Configuration</h1>
        <p className="text-destructive">Failed to load configuration</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Configuration</h1>
        <p className="text-muted-foreground">
          Configure email settings, filters, and system parameters
        </p>
      </div>

      {saveSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
          Configuration saved successfully
        </div>
      )}

      {/* Email Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Email Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email-host">IMAP Host</Label>
              <Input
                id="email-host"
                value={config.email.host}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    email: { ...config.email, host: e.target.value },
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-port">Port</Label>
              <Input
                id="email-port"
                type="number"
                value={config.email.port}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    email: { ...config.email, port: parseInt(e.target.value) },
                  })
                }
              />
              {getFieldError("email.port") && (
                <p className="text-sm text-destructive">{getFieldError("email.port")}</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email-username">Email Address</Label>
            <Input
              id="email-username"
              type="email"
              value={config.email.username}
              onChange={(e) =>
                setConfig({
                  ...config,
                  email: { ...config.email, username: e.target.value },
                })
              }
            />
            {getFieldError("email.username") && (
              <p className="text-sm text-destructive">{getFieldError("email.username")}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email-password">Password</Label>
            <Input
              id="email-password"
              type="password"
              placeholder="Enter new password or leave unchanged"
              value={config.email.password}
              onChange={(e) =>
                setConfig({
                  ...config,
                  email: { ...config.email, password: e.target.value },
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email-interval">Check Interval (seconds)</Label>
            <Input
              id="email-interval"
              type="number"
              value={config.email.checkIntervalSeconds}
              onChange={(e) =>
                setConfig({
                  ...config,
                  email: {
                    ...config.email,
                    checkIntervalSeconds: parseInt(e.target.value),
                  },
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Filter Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Rules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="filter-subject-contains">Subject Contains</Label>
            <Input
              id="filter-subject-contains"
              placeholder="e.g., DISPATCH"
              value={config.filter.subjectContains || ""}
              onChange={(e) =>
                setConfig({
                  ...config,
                  filter: { ...config.filter, subjectContains: e.target.value },
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="filter-subject-regex">
              Subject Regex (mutually exclusive with contains)
            </Label>
            <Input
              id="filter-subject-regex"
              placeholder="e.g., ^FIRE-\\d+"
              value={config.filter.subjectRegex || ""}
              onChange={(e) =>
                setConfig({
                  ...config,
                  filter: { ...config.filter, subjectRegex: e.target.value },
                })
              }
            />
          </div>
          {getFieldError("filter") && (
            <p className="text-sm text-destructive">{getFieldError("filter")}</p>
          )}
          <div className="space-y-2">
            <Label htmlFor="filter-from">From Address</Label>
            <Input
              id="filter-from"
              type="email"
              placeholder="e.g., dispatch@emergency.com"
              value={config.filter.fromAddress || ""}
              onChange={(e) =>
                setConfig({
                  ...config,
                  filter: { ...config.filter, fromAddress: e.target.value },
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Station Location */}
      <Card>
        <CardHeader>
          <CardTitle>Station Location</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="station-name">Station Name</Label>
            <Input
              id="station-name"
              value={config.station.name}
              onChange={(e) =>
                setConfig({
                  ...config,
                  station: { ...config.station, name: e.target.value },
                })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="station-lat">Latitude</Label>
              <Input
                id="station-lat"
                type="number"
                step="0.0001"
                value={config.station.latitude}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    station: {
                      ...config.station,
                      latitude: parseFloat(e.target.value),
                    },
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="station-lon">Longitude</Label>
              <Input
                id="station-lon"
                type="number"
                step="0.0001"
                value={config.station.longitude}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    station: {
                      ...config.station,
                      longitude: parseFloat(e.target.value),
                    },
                  })
                }
              />
            </div>
          </div>
          {getFieldError("station") && (
            <p className="text-sm text-destructive">{getFieldError("station")}</p>
          )}
        </CardContent>
      </Card>

      {/* CUPS Settings */}
      <Card>
        <CardHeader>
          <CardTitle>CUPS Printer Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cups-host">CUPS Host</Label>
              <Input
                id="cups-host"
                value={config.cups.host}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    cups: { ...config.cups, host: e.target.value },
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cups-port">Port</Label>
              <Input
                id="cups-port"
                type="number"
                value={config.cups.port}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    cups: { ...config.cups, port: parseInt(e.target.value) },
                  })
                }
              />
              {getFieldError("cups.port") && (
                <p className="text-sm text-destructive">{getFieldError("cups.port")}</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cups-printer">Printer Name</Label>
            <Input
              id="cups-printer"
              value={config.cups.printerName}
              onChange={(e) =>
                setConfig({
                  ...config,
                  cups: { ...config.cups, printerName: e.target.value },
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Print Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Print Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="print-retry-count">Auto Retry Count</Label>
              <Input
                id="print-retry-count"
                type="number"
                value={config.print.autoRetryCount}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    print: {
                      ...config.print,
                      autoRetryCount: parseInt(e.target.value),
                    },
                  })
                }
              />
              {getFieldError("print.autoRetryCount") && (
                <p className="text-sm text-destructive">{getFieldError("print.autoRetryCount")}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="print-retry-delay">Retry Delay (seconds)</Label>
              <Input
                id="print-retry-delay"
                type="number"
                value={config.print.retryDelaySeconds}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    print: {
                      ...config.print,
                      retryDelaySeconds: parseInt(e.target.value),
                    },
                  })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Map API Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Map API Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="map-provider">Provider</Label>
            <Input id="map-provider" value={config.map.provider} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="map-api-key">API Key</Label>
            <Input
              id="map-api-key"
              type="password"
              placeholder="Enter new API key or leave unchanged"
              value={config.map.apiKey}
              onChange={(e) =>
                setConfig({
                  ...config,
                  map: { ...config.map, apiKey: e.target.value },
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Configuration"}
        </Button>
        <Button variant="outline" onClick={() => window.location.reload()} disabled={isSaving}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
