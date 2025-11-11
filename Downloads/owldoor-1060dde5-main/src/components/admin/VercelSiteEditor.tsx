import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ExternalLink, RefreshCcw, Globe, Settings, Code } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface VercelProject {
  id: string;
  name: string;
  accountId: string;
  updatedAt: number;
  createdAt: number;
  productionDeployment?: {
    url: string;
  };
  latestDeployment?: {
    url: string;
  };
}

interface VercelDeployment {
  id: string;
  url: string;
  state: string;
  createdAt: number;
  readyAt?: number;
}

export const VercelSiteEditor = () => {
  const [vercelToken, setVercelToken] = useState("");
  const [projects, setProjects] = useState<VercelProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [deployments, setDeployments] = useState<VercelDeployment[]>([]);
  const [loading, setLoading] = useState(false);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load Vercel token from environment or localStorage
    const storedToken = localStorage.getItem("vercel_token") || import.meta.env.VITE_VERCEL_TOKEN || "";
    if (storedToken) {
      setVercelToken(storedToken);
      fetchProjects(storedToken);
    }
  }, []);

  const fetchProjects = async (token: string) => {
    if (!token) return;
    
    setLoading(true);
    try {
      const response = await fetch("https://api.vercel.com/v9/projects", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }

      const data = await response.json();
      setProjects(data.projects || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast({
        title: "Error",
        description: "Failed to fetch Vercel projects. Check your token.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDeployments = async (projectId: string) => {
    if (!vercelToken || !projectId) return;

    setLoading(true);
    try {
      const response = await fetch(
        `https://api.vercel.com/v6/deployments?projectId=${projectId}&limit=10`,
        {
          headers: {
            Authorization: `Bearer ${vercelToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch deployments");
      }

      const data = await response.json();
      setDeployments(data.deployments || []);
    } catch (error) {
      console.error("Error fetching deployments:", error);
      toast({
        title: "Error",
        description: "Failed to fetch deployments.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTokenSave = () => {
    if (!vercelToken.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid Vercel token.",
        variant: "destructive",
      });
      return;
    }

    localStorage.setItem("vercel_token", vercelToken);
    fetchProjects(vercelToken);
    setConfigDialogOpen(false);
    toast({
      title: "Success",
      description: "Vercel token saved successfully.",
    });
  };

  const handleProjectSelect = (projectId: string) => {
    setSelectedProject(projectId);
    fetchDeployments(projectId);
  };

  const getDeploymentStateColor = (state: string) => {
    switch (state) {
      case "READY":
        return "bg-green-500";
      case "BUILDING":
        return "bg-blue-500";
      case "ERROR":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const selectedProjectData = projects.find((p) => p.id === selectedProject);

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Vercel Site Editor</h2>
          <p className="text-sm text-muted-foreground">
            Manage and edit your Vercel deployments. Connect your Vercel account to get started.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="mr-2 h-4 w-4" />
                Configure
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Vercel Configuration</DialogTitle>
                <DialogDescription>
                  Enter your Vercel API token to access your projects and deployments.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="vercel-token">Vercel API Token</Label>
                  <Input
                    id="vercel-token"
                    type="password"
                    placeholder="Enter your Vercel token"
                    value={vercelToken}
                    onChange={(e) => setVercelToken(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Get your token from{" "}
                    <a
                      href="https://vercel.com/account/tokens"
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline"
                    >
                      Vercel Settings
                    </a>
                  </p>
                </div>
                <Button onClick={handleTokenSave} className="w-full">
                  Save Token
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="secondary" onClick={() => vercelToken && fetchProjects(vercelToken)}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {!vercelToken && (
        <Alert>
          <AlertTitle>Vercel Token Required</AlertTitle>
          <AlertDescription>
            Please configure your Vercel API token to access your projects and deployments.
            Click the Configure button above to get started.
          </AlertDescription>
        </Alert>
      )}

      {vercelToken && projects.length === 0 && !loading && (
        <Alert>
          <AlertTitle>No Projects Found</AlertTitle>
          <AlertDescription>
            No Vercel projects found. Make sure your token has the correct permissions.
          </AlertDescription>
        </Alert>
      )}

      {vercelToken && projects.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Select Project</CardTitle>
              <CardDescription>Choose a Vercel project to manage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedProject} onValueChange={handleProjectSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedProjectData && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Production URL:</span>
                    {selectedProjectData.productionDeployment?.url ? (
                      <a
                        href={`https://${selectedProjectData.productionDeployment.url}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                      >
                        <Globe className="h-3 w-3" />
                        {selectedProjectData.productionDeployment.url}
                      </a>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not deployed</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Latest Deployment:</span>
                    {selectedProjectData.latestDeployment?.url ? (
                      <a
                        href={`https://${selectedProjectData.latestDeployment.url}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View
                      </a>
                    ) : (
                      <span className="text-sm text-muted-foreground">No deployments</span>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Deployments</CardTitle>
              <CardDescription>View and manage project deployments</CardDescription>
            </CardHeader>
            <CardContent>
              {selectedProject ? (
                <div className="space-y-2">
                  {loading ? (
                    <div className="text-sm text-muted-foreground">Loading deployments...</div>
                  ) : deployments.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No deployments found</div>
                  ) : (
                    deployments.map((deployment) => (
                      <div
                        key={deployment.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${getDeploymentStateColor(
                              deployment.state
                            )}`}
                          />
                          <div>
                            <div className="text-sm font-medium">
                              {new Date(deployment.createdAt).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {deployment.state}
                            </div>
                          </div>
                        </div>
                        <a
                          href={`https://${deployment.url}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View
                        </a>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Select a project to view deployments
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {selectedProjectData && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage your Vercel project</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button
              variant="outline"
              asChild
              className="flex-1"
            >
              <a
                href={`https://vercel.com/dashboard/${selectedProjectData.accountId}/${selectedProjectData.name}`}
                target="_blank"
                rel="noreferrer"
              >
                <Settings className="mr-2 h-4 w-4" />
                Open Dashboard
              </a>
            </Button>
            <Button
              variant="outline"
              asChild
              className="flex-1"
            >
              <a
                href={`https://vercel.com/${selectedProjectData.accountId}/${selectedProjectData.name}/settings`}
                target="_blank"
                rel="noreferrer"
              >
                <Code className="mr-2 h-4 w-4" />
                Project Settings
              </a>
            </Button>
            {selectedProjectData.productionDeployment?.url && (
              <Button
                variant="outline"
                asChild
                className="flex-1"
              >
                <a
                  href={`https://${selectedProjectData.productionDeployment.url}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Globe className="mr-2 h-4 w-4" />
                  View Site
                </a>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

