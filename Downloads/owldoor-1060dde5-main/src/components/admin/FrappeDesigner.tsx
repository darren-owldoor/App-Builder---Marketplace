import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ExternalLink, RefreshCcw } from "lucide-react";
import { DEFAULT_FRAPPE_URL, getFrappeUrl } from "@/lib/frappe";

export const FrappeDesigner = () => {
  const frappeUrl = getFrappeUrl();

  const isUsingDefaultUrl = frappeUrl === DEFAULT_FRAPPE_URL;

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Frappe Designer</h2>
          <p className="text-sm text-muted-foreground">
            Design and build applications with Frappe Framework. Configure your self-hosted Frappe instance URL to get started.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <a href="https://frappeframework.com/docs" target="_blank" rel="noreferrer">
              View Docs
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Refresh Designer
            <RefreshCcw className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      {isUsingDefaultUrl && (
        <Alert>
          <AlertTitle>Configure a self-hosted Frappe instance</AlertTitle>
          <AlertDescription>
            Set <code>VITE_FRAPPE_URL</code> in your environment to point to your own Frappe deployment or tunnel URL.
            The default URL is provided for quick evaluation only.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex-1 rounded-lg border border-border overflow-hidden bg-muted">
        <iframe
          src={frappeUrl}
          title="Frappe Designer"
          className="w-full h-full border-0"
          allow="clipboard-write; fullscreen; vr"
          sandbox="allow-scripts allow-same-origin allow-forms allow-downloads allow-popups"
        />
      </div>
    </div>
  );
};

