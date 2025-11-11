import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExternalLink, RefreshCcw, Settings, ChevronDown, ChevronUp, FileText, Folder, Loader2, Copy } from "lucide-react";
import { DEFAULT_CLAUDABLE_URL, getClaudableUrl, setClaudableUrl } from "@/lib/claudable";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface VercelProject {
  id: string;
  name: string;
  accountId: string;
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
}

interface FileNode {
  name: string;
  type: "file" | "directory";
  path: string;
  children?: FileNode[];
}

export const ClaudableDesigner = () => {
  const [claudableUrl, setClaudableUrlState] = useState(getClaudableUrl());
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [vercelPanelOpen, setVercelPanelOpen] = useState(false);
  const [vercelToken, setVercelToken] = useState("");
  const [vercelProjects, setVercelProjects] = useState<VercelProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedDeployment, setSelectedDeployment] = useState<string>("");
  const [deployments, setDeployments] = useState<VercelDeployment[]>([]);
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { toast } = useToast();

  const isUsingDefaultUrl = claudableUrl === DEFAULT_CLAUDABLE_URL;

  useEffect(() => {
    setClaudableUrlState(getClaudableUrl());
    // Load Vercel token
    const storedToken = localStorage.getItem("vercel_token") || import.meta.env.VITE_VERCEL_TOKEN || "";
    if (storedToken) {
      setVercelToken(storedToken);
      fetchVercelProjects(storedToken);
    }
  }, []);

  const fetchVercelProjects = async (token: string) => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch("https://api.vercel.com/v9/projects", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch projects");
      const data = await response.json();
      setVercelProjects(data.projects || []);
    } catch (error) {
      console.error("Error fetching Vercel projects:", error);
      toast({
        title: "Error",
        description: "Failed to fetch Vercel projects. Configure token in Vercel Sites view.",
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
        `https://api.vercel.com/v6/deployments?projectId=${projectId}&limit=20`,
        { headers: { Authorization: `Bearer ${vercelToken}` } }
      );
      if (!response.ok) throw new Error("Failed to fetch deployments");
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

  const fetchFileTree = async (deploymentId: string) => {
    if (!vercelToken || !deploymentId) return;
    setLoading(true);
    try {
      // Try to get files from deployment
      const response = await fetch(
        `https://api.vercel.com/v13/deployments/${deploymentId}/files`,
        { headers: { Authorization: `Bearer ${vercelToken}` } }
      );
      
      if (response.ok) {
        const data = await response.json();
        const tree = buildFileTree(data.files || []);
        setFileTree(tree);
      } else {
        // Alternative: Try to get from project source
        const project = vercelProjects.find(p => p.id === selectedProject);
        if (project) {
          // Try fetching from project's source repository
          const projectResponse = await fetch(
            `https://api.vercel.com/v9/projects/${selectedProject}`,
            { headers: { Authorization: `Bearer ${vercelToken}` } }
          );
          if (projectResponse.ok) {
            const projectData = await projectResponse.json();
            // Create a simple file structure based on common patterns
            const commonPages = [
              { name: "index", path: "/index", type: "file" },
              { name: "about", path: "/about", type: "file" },
              { name: "contact", path: "/contact", type: "file" },
              { name: "home", path: "/home", type: "file" },
            ];
            setFileTree(commonPages.map(p => ({ ...p, children: undefined })));
            toast({
              title: "Info",
              description: "Using common page patterns. Select a page to load.",
            });
          }
        }
      }
    } catch (error) {
      console.error("Error fetching file tree:", error);
      // Create default pages structure
      const defaultPages: FileNode[] = [
        { name: "Home", path: "/", type: "file" },
        { name: "About", path: "/about", type: "file" },
        { name: "Contact", path: "/contact", type: "file" },
      ];
      setFileTree(defaultPages);
      toast({
        title: "Using Default Pages",
        description: "Could not fetch files. Showing default page structure.",
      });
    } finally {
      setLoading(false);
    }
  };

  const buildFileTree = (files: Array<{ type: string; name: string; path: string }>): FileNode[] => {
    const tree: Record<string, FileNode> = {};
    
    files.forEach((file) => {
      const parts = file.path.split("/").filter(Boolean);
      let current = tree;
      
      parts.forEach((part, index) => {
        const isLast = index === parts.length - 1;
        const path = parts.slice(0, index + 1).join("/");
        
        if (!current[path]) {
          current[path] = {
            name: part,
            type: isLast ? "file" : "directory",
            path: `/${path}`,
            children: {},
          };
        }
        
        if (!isLast && current[path].children) {
          current = current[path].children as Record<string, FileNode>;
        }
      });
    });
    
    const convertToArray = (obj: Record<string, FileNode>): FileNode[] => {
      return Object.values(obj).map((node) => ({
        ...node,
        children: node.children ? convertToArray(node.children as Record<string, FileNode>) : undefined,
      }));
    };
    
    return convertToArray(tree);
  };

  const handleProjectSelect = (projectId: string) => {
    setSelectedProject(projectId);
    setSelectedDeployment("");
    setFileTree([]);
    fetchDeployments(projectId);
  };

  const handleDeploymentSelect = (deploymentId: string) => {
    setSelectedDeployment(deploymentId);
    fetchFileTree(deploymentId);
  };

  const handlePageSelect = async (pagePath: string) => {
    // Try to fetch the page content and send to Claudable
    if (selectedDeployment && iframeRef.current?.contentWindow) {
      try {
        const deployment = deployments.find(d => d.id === selectedDeployment);
        if (deployment) {
          // Send page info to Claudable
          iframeRef.current.contentWindow.postMessage(
            { 
              type: "OPEN_PAGE", 
              path: pagePath,
              deploymentUrl: deployment.url,
              projectId: selectedProject
            },
            "*"
          );
          toast({
            title: "Loading Page",
            description: `Opening ${pagePath} in Claudable...`,
          });
        }
      } catch (error) {
        console.error("Error loading page:", error);
        toast({
          title: "Info",
          description: `Page: ${pagePath}. Navigate manually in Claudable.`,
        });
      }
    } else {
      toast({
        title: "Info",
        description: `Selected: ${pagePath}. Configure deployment first.`,
      });
    }
  };

  const handleLoadAsTemplate = async (pagePath: string) => {
    // Store page info to be loaded as template
    const templateInfo = {
      path: pagePath,
      projectId: selectedProject,
      deploymentId: selectedDeployment,
      timestamp: Date.now(),
    };
    localStorage.setItem(`claudable_template_${pagePath}`, JSON.stringify(templateInfo));
    toast({
      title: "Template Saved",
      description: `${pagePath} saved as template. Available in templates library.`,
    });
  };

  const filterPages = (nodes: FileNode[]): FileNode[] => {
    const pages: FileNode[] = [];
    const pageExtensions = [".tsx", ".jsx", ".ts", ".js", ".html"];
    
    const traverse = (node: FileNode) => {
      if (node.type === "file" && pageExtensions.some(ext => node.name.endsWith(ext))) {
        pages.push(node);
      }
      if (node.children) {
        node.children.forEach(traverse);
      }
    };
    
    nodes.forEach(traverse);
    return pages;
  };

  const handleUrlSave = () => {
    if (!urlInput.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid URL.",
        variant: "destructive",
      });
      return;
    }

    // Ensure URL has protocol
    let url = urlInput.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = `https://${url}`;
    }

    setClaudableUrl(url);
    setClaudableUrlState(getClaudableUrl());
    setConfigDialogOpen(false);
    toast({
      title: "Success",
      description: "Claudable URL saved successfully. Refreshing...",
    });
    
    // Reload after a short delay to apply changes
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const handleResetToDefault = () => {
    localStorage.removeItem("claudable_url");
    setClaudableUrlState(DEFAULT_CLAUDABLE_URL);
    setConfigDialogOpen(false);
    toast({
      title: "Reset",
      description: "Reset to default Claudable URL. Refreshing...",
    });
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Visual Builder (Claudable)</h2>
          <p className="text-sm text-muted-foreground">
            Design admin and marketing experiences visually with Claudable. Changes here are for exploration—export code when ready.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="mr-2 h-4 w-4" />
                Configure URL
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Configure Claudable URL</DialogTitle>
                <DialogDescription>
                  Enter your Claudable deployment URL. This can be a Vercel deployment, custom domain, or local development URL.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="claudable-url">Claudable URL</Label>
                  <Input
                    id="claudable-url"
                    type="url"
                    placeholder="https://claudable.vercel.app or https://claudable.yourdomain.com"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleUrlSave();
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    The <code>?embed=1</code> parameter will be added automatically.
                  </p>
                  {claudableUrl !== DEFAULT_CLAUDABLE_URL && (
                    <div className="mt-2 p-2 bg-muted rounded text-xs">
                      <p className="font-medium">Current URL:</p>
                      <p className="text-muted-foreground break-all">{claudableUrl}</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleUrlSave} className="flex-1">
                    Save URL
                  </Button>
                  {claudableUrl !== DEFAULT_CLAUDABLE_URL && (
                    <Button variant="outline" onClick={handleResetToDefault}>
                      Reset to Default
                    </Button>
                  )}
                </div>
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    <strong>Tip:</strong> For Vercel deployments, use the deployment URL (e.g.,{" "}
                    <code className="text-xs">claudable-abc123.vercel.app</code>) or production URL.
                    You can find this in your Vercel dashboard.
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" asChild>
            <a href="https://github.com/opactorai/Claudable" target="_blank" rel="noreferrer">
              View Docs
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Refresh Builder
            <RefreshCcw className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      {isUsingDefaultUrl && (
        <Alert>
          <AlertTitle>Configure your Claudable instance</AlertTitle>
          <AlertDescription>
            Click "Configure URL" above to set your Vercel deployment URL. The default public sandbox is provided for quick evaluation only.
          </AlertDescription>
        </Alert>
      )}

      {!isUsingDefaultUrl && (
        <Alert>
          <AlertTitle>Using custom Claudable instance</AlertTitle>
          <AlertDescription>
            Connected to: <code className="text-xs">{claudableUrl}</code>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex-1 rounded-lg border border-border overflow-hidden bg-muted relative">
        <iframe
          ref={iframeRef}
          src={claudableUrl}
          title="Claudable Visual Builder"
          className="w-full h-full border-0"
          allow="clipboard-write; fullscreen; vr"
          sandbox="allow-scripts allow-same-origin allow-forms allow-downloads allow-popups"
        />
      </div>

      {/* Vercel Integration Panel */}
      <Collapsible open={vercelPanelOpen} onOpenChange={setVercelPanelOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between"
            disabled={!vercelToken}
          >
            <span className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Vercel Projects & Pages
            </span>
            {vercelPanelOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <div className="border rounded-lg bg-card p-4 space-y-4 max-h-96 overflow-y-auto">
            {!vercelToken ? (
              <Alert>
                <AlertTitle>Vercel Token Required</AlertTitle>
                <AlertDescription>
                  Configure your Vercel token in the{" "}
                  <a href="/admin?view=vercel" className="text-primary underline">
                    Vercel Sites
                  </a>{" "}
                  view first.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Select Vercel Project</Label>
                  <Select
                    value={selectedProject}
                    onValueChange={handleProjectSelect}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a project..." />
                    </SelectTrigger>
                    <SelectContent>
                      {vercelProjects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedProject && deployments.length > 0 && (
                  <div className="space-y-2">
                    <Label>Select Deployment</Label>
                    <Select
                      value={selectedDeployment}
                      onValueChange={handleDeploymentSelect}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a deployment..." />
                      </SelectTrigger>
                      <SelectContent>
                        {deployments.map((deployment) => (
                          <SelectItem key={deployment.id} value={deployment.id}>
                            {deployment.url} ({deployment.state})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {selectedDeployment && (
                  <div className="space-y-2">
                    <Label>Pages & Sections</Label>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {fileTree.length > 0 ? (
                        filterPages(fileTree).map((page) => (
                          <div key={page.path} className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              className="flex-1 justify-start text-left h-auto py-2"
                              onClick={() => handlePageSelect(page.path)}
                            >
                              <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
                              <span className="truncate text-sm">{page.path}</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleLoadAsTemplate(page.path)}
                              title="Load as template"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        ))
                      ) : (
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground p-2">
                            No pages found. Loading common pages...
                          </p>
                          {[
                            { name: "Home", path: "/" },
                            { name: "About", path: "/about" },
                            { name: "Contact", path: "/contact" },
                            { name: "Landing", path: "/landing" },
                          ].map((page) => (
                            <div key={page.path} className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                className="flex-1 justify-start text-left h-auto py-2"
                                onClick={() => handlePageSelect(page.path)}
                              >
                                <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
                                <span className="truncate text-sm">{page.name} ({page.path})</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleLoadAsTemplate(page.path)}
                                title="Load as template"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {loading && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm text-muted-foreground">Loading...</span>
                  </div>
                )}
              </>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

