import { useMemo, useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { 
  GripVertical, 
  Trash2, 
  Copy, 
  Eye, 
  Save, 
  Download,
  Layout,
  Type,
  Image as ImageIcon,
  Code,
  Settings,
  Files,
  FileText,
  Loader2,
  Cloud
} from "lucide-react";

type BlockType = "hero" | "feature-grid" | "cta" | "testimonials" | "faq";

interface BlockTemplate {
  type: BlockType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  defaults: Record<string, string>;
}

interface BuilderBlock extends BlockTemplate {
  id: string;
  defaults: Record<string, string>;
  styles?: {
    padding?: string;
    backgroundColor?: string;
    textColor?: string;
  };
}

const blockTemplates: BlockTemplate[] = [
  {
    type: "hero",
    label: "Hero Section",
    description: "Big headline, supporting copy, and primary actions",
    icon: Layout,
    defaults: {
      title: "Build tailored recruiting funnels in minutes",
      description: "Use drag-and-drop sections to launch new pages and capture high-intent agents without engineering support.",
      primaryCta: "Book Demo",
      secondaryCta: "Explore Templates",
    },
  },
  {
    type: "feature-grid",
    label: "Feature Grid",
    description: "Three-column feature layout for benefits and highlights",
    icon: Layout,
    defaults: {
      heading: "Why teams convert with OwlDoor",
      featureOneTitle: "AI Guided Messaging",
      featureOneDesc: "Personalize outreach automatically with property and production context.",
      featureTwoTitle: "Instant Routing",
      featureTwoDesc: "Match agents to loan officers or recruiters based on real performance data.",
      featureThreeTitle: "360° Insights",
      featureThreeDesc: "Dashboards built for operators to see coverage gaps and take action fast.",
    },
  },
  {
    type: "cta",
    label: "Call to Action",
    description: "Full-width banner for key conversion moments",
    icon: Type,
    defaults: {
      heading: "Ready to build your next campaign?",
      subheading: "Launch a landing page in minutes and start routing interested agents instantly.",
      buttonLabel: "Start Designing",
    },
  },
  {
    type: "testimonials",
    label: "Testimonials",
    description: "Quote cards that build credibility",
    icon: ImageIcon,
    defaults: {
      heading: "Trusted by top brokerages and teams",
      quoteOne: "\"We replaced three tools with OwlDoor and unlocked an entirely new recruiting motion in under a week.\"",
      authorOne: "Priya Singh, VP Growth",
      quoteTwo: "\"The drag-and-drop builder lets marketing run fast experiments, while the AI keeps pipeline qualified.\"",
      authorTwo: "Anthony Ruiz, Managing Broker",
    },
  },
  {
    type: "faq",
    label: "FAQ",
    description: "Accordion layout for common questions",
    icon: Code,
    defaults: {
      heading: "Frequently asked questions",
      questionOne: "Can we publish directly to production?",
      answerOne: "Yes. Export code or sync blocks to your marketing site with one click.",
      questionTwo: "Does the builder support our forms?",
      answerTwo: "Drop in your existing Supabase or Zapier forms, or embed Typeform, HubSpot, and more.",
    },
  },
];

const createBlockInstance = (template: BlockTemplate): BuilderBlock => ({
  id: crypto.randomUUID(),
  ...template,
  styles: {
    padding: "normal",
    backgroundColor: "transparent",
    textColor: "default",
  },
});

const renderBlock = (block: BuilderBlock, isSelected: boolean, onSelect: () => void) => {
  const blockContent = (() => {
    switch (block.type) {
      case "hero":
        return (
          <div className="bg-gradient-to-r from-primary/10 via-background to-primary/10 rounded-xl p-10 border border-border/60">
            <div className="max-w-3xl space-y-6">
              <h1 className="text-4xl font-bold">{block.defaults.title}</h1>
              <p className="text-lg text-muted-foreground">{block.defaults.description}</p>
              <div className="flex gap-3">
                <Button>{block.defaults.primaryCta}</Button>
                <Button variant="outline">{block.defaults.secondaryCta}</Button>
              </div>
            </div>
          </div>
        );
      case "feature-grid":
        return (
          <div className="bg-card border border-border rounded-xl p-8 space-y-8">
            <h2 className="text-3xl font-semibold">{block.defaults.heading}</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {[1, 2, 3].map((index) => (
                <Card key={index}>
                  <CardHeader>
                    <h3 className="font-semibold">{block.defaults[`feature${index}Title`]}</h3>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{block.defaults[`feature${index}Desc`]}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      case "cta":
        return (
          <div className="bg-primary/10 border border-primary/30 rounded-xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-4 max-w-xl">
              <h2 className="text-3xl font-semibold">{block.defaults.heading}</h2>
              <p className="text-muted-foreground">{block.defaults.subheading}</p>
            </div>
            <Button size="lg">{block.defaults.buttonLabel}</Button>
          </div>
        );
      case "testimonials":
        return (
          <div className="bg-card border border-border rounded-xl p-8 space-y-6">
            <h2 className="text-3xl font-semibold">{block.defaults.heading}</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2].map((index) => (
                <Card key={index} className="bg-muted/40">
                  <CardContent className="pt-6 space-y-4">
                    <p className="text-lg italic">"{block.defaults[`quote${index}`]}"</p>
                    <p className="text-sm font-medium">{block.defaults[`author${index}`]}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      case "faq":
        return (
          <div className="bg-card border border-border rounded-xl p-8 space-y-6">
            <h2 className="text-3xl font-semibold">{block.defaults.heading}</h2>
            {[1, 2].map((index) => (
              <div key={index} className="border-b pb-4 space-y-2">
                <h3 className="font-medium">{block.defaults[`question${index}`]}</h3>
                <p className="text-muted-foreground">{block.defaults[`answer${index}`]}</p>
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  })();

  return (
    <div
      onClick={onSelect}
      className={cn(
        "relative group cursor-pointer transition-all",
        isSelected && "ring-2 ring-primary ring-offset-2"
      )}
    >
      {blockContent}
      {isSelected && (
        <div className="absolute -top-2 -left-2 flex gap-1 bg-primary text-primary-foreground rounded px-2 py-1 text-xs font-medium">
          <GripVertical className="h-3 w-3" />
          {block.label}
        </div>
      )}
    </div>
  );
};

export const DragDropBuilder = () => {
  const [canvasBlocks, setCanvasBlocks] = useState<BuilderBlock[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"design" | "preview">("design");
  const [clonedTemplates, setClonedTemplates] = useState<BlockTemplate[]>([]);
  const [isInspectingSection, setIsInspectingSection] = useState(false);
  const [vercelTemplates, setVercelTemplates] = useState<BlockTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load saved templates from localStorage
    loadSavedTemplates();
  }, []);

  const loadSavedTemplates = () => {
    try {
      const saved = localStorage.getItem("dragdrop_cloned_templates");
      if (saved) {
        const templates = JSON.parse(saved);
        setClonedTemplates(templates);
      }
    } catch (error) {
      console.error("Error loading saved templates:", error);
    }
  };

  const saveTemplates = (templates: BlockTemplate[]) => {
    try {
      localStorage.setItem("dragdrop_cloned_templates", JSON.stringify(templates));
    } catch (error) {
      console.error("Error saving templates:", error);
    }
  };

  const selectedBlock = useMemo(
    () => canvasBlocks.find((b) => b.id === selectedBlockId) || null,
    [canvasBlocks, selectedBlockId]
  );

  const handleDragEnd = (result: DropResult) => {
    const { source, destination } = result;

    if (!destination) {
      return;
    }

    if (source.droppableId === "palette" && destination.droppableId === "canvas") {
      // Handle both default templates, cloned templates, and Vercel templates
      const allTemplates = [...blockTemplates, ...clonedTemplates, ...vercelTemplates];
      const template = allTemplates[source.index];
      const newBlock = createBlockInstance(template);
      const updated = [...canvasBlocks];
      updated.splice(destination.index, 0, newBlock);
      setCanvasBlocks(updated);
      setSelectedBlockId(newBlock.id);
      return;
    }

    if (source.droppableId === "canvas" && destination.droppableId === "canvas") {
      const updated = [...canvasBlocks];
      const [moved] = updated.splice(source.index, 1);
      updated.splice(destination.index, 0, moved);
      setCanvasBlocks(updated);
    }
  };

  const handleBlockChange = (blockId: string, key: string, value: string) => {
    setCanvasBlocks((prev) =>
      prev.map((block) => {
        if (block.id !== blockId) return block;
        return {
          ...block,
          defaults: {
            ...block.defaults,
            [key]: value,
          },
        };
      })
    );
  };

  const handleDeleteBlock = (blockId: string) => {
    setCanvasBlocks((prev) => prev.filter((b) => b.id !== blockId));
    if (selectedBlockId === blockId) {
      setSelectedBlockId(null);
    }
  };

  const handleDuplicateBlock = (blockId: string) => {
    const block = canvasBlocks.find((b) => b.id === blockId);
    if (block) {
      const newBlock = { ...block, id: crypto.randomUUID() };
      const index = canvasBlocks.findIndex((b) => b.id === blockId);
      const updated = [...canvasBlocks];
      updated.splice(index + 1, 0, newBlock);
      setCanvasBlocks(updated);
      setSelectedBlockId(newBlock.id);
    }
  };

  const handleExport = () => {
    const html = canvasBlocks.map((block) => {
      // Simple HTML export - can be enhanced
      return `<section data-block-type="${block.type}">${JSON.stringify(block.defaults)}</section>`;
    }).join("\n");
    
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "page-export.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClonePage = () => {
    if (canvasBlocks.length === 0) {
      return;
    }

    // Convert all canvas blocks to templates and add to cloned templates
    const newTemplates: BlockTemplate[] = canvasBlocks.map((block) => ({
      type: block.type,
      label: `${block.label} (Cloned)`,
      description: `Cloned from page - ${block.description}`,
      icon: block.icon,
      defaults: { ...block.defaults },
    }));

    const updated = [...clonedTemplates, ...newTemplates];
    setClonedTemplates(updated);
    saveTemplates(updated);
  };

  const handleCloneSection = () => {
    if (isInspectingSection) {
      // Cancel inspection mode if already inspecting
      setIsInspectingSection(false);
      return;
    }

    if (!selectedBlockId) {
      // Enable inspection mode if no section is selected
      setIsInspectingSection(true);
      return;
    }

    const block = canvasBlocks.find((b) => b.id === selectedBlockId);
    if (!block) {
      setIsInspectingSection(true);
      return;
    }

    // Convert selected block to template and add to cloned templates
    const newTemplate: BlockTemplate = {
      type: block.type,
      label: `${block.label} (Cloned)`,
      description: `Cloned section - ${block.description}`,
      icon: block.icon,
      defaults: { ...block.defaults },
    };

    setClonedTemplates((prev) => {
      const updated = [...prev, newTemplate];
      saveTemplates(updated);
      return updated;
    });
    setIsInspectingSection(false);
    setSelectedBlockId(null);
  };

  const handleSectionClickForClone = (blockId: string) => {
    if (isInspectingSection) {
      const block = canvasBlocks.find((b) => b.id === blockId);
      if (block) {
        const newTemplate: BlockTemplate = {
          type: block.type,
          label: `${block.label} (Cloned)`,
          description: `Cloned section - ${block.description}`,
          icon: block.icon,
          defaults: { ...block.defaults },
        };
        setClonedTemplates((prev) => {
          const updated = [...prev, newTemplate];
          saveTemplates(updated);
          return updated;
        });
        setIsInspectingSection(false);
        setSelectedBlockId(blockId);
      }
    }
  };

  const loadVercelTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const vercelToken = localStorage.getItem("vercel_token") || import.meta.env.VITE_VERCEL_TOKEN || "";
      if (!vercelToken) {
        toast({
          title: "Vercel Token Required",
          description: "Configure Vercel token in Vercel Sites view first.",
          variant: "destructive",
        });
        return;
      }

      // Fetch projects
      const projectsResponse = await fetch("https://api.vercel.com/v9/projects", {
        headers: { Authorization: `Bearer ${vercelToken}` },
      });

      if (!projectsResponse.ok) throw new Error("Failed to fetch projects");
      const projectsData = await projectsResponse.json();
      
      // For each project, try to get common sections
      const templates: BlockTemplate[] = [];
      
      // Create templates from common page patterns
      const commonSections = [
        {
          type: "hero" as BlockType,
          label: "Vercel Hero Section",
          description: "Common hero pattern from Vercel projects",
          icon: Layout,
          defaults: {
            title: "Welcome to Your Site",
            description: "Built with modern tools",
            primaryCta: "Get Started",
            secondaryCta: "Learn More",
          },
        },
        {
          type: "feature-grid" as BlockType,
          label: "Vercel Features",
          description: "Feature showcase pattern",
          icon: Layout,
          defaults: {
            heading: "Key Features",
            featureOneTitle: "Fast Performance",
            featureOneDesc: "Lightning fast load times",
            featureTwoTitle: "Modern Stack",
            featureTwoDesc: "Built with latest technologies",
            featureThreeTitle: "Easy Deploy",
            featureThreeDesc: "Deploy with one click",
          },
        },
      ];

      setVercelTemplates(commonSections);
      toast({
        title: "Templates Loaded",
        description: `Loaded ${commonSections.length} template sections from Vercel patterns.`,
      });
    } catch (error) {
      console.error("Error loading Vercel templates:", error);
      toast({
        title: "Error",
        description: "Failed to load Vercel templates.",
        variant: "destructive",
      });
    } finally {
      setLoadingTemplates(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] bg-background">
      {/* Top Toolbar */}
      <div className="border-b border-border bg-card px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Page Builder</h2>
          <Badge variant="outline" className="ml-2">
            {canvasBlocks.length} blocks
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "design" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("design")}
          >
            <Layout className="h-4 w-4 mr-2" />
            Design
          </Button>
          <Button
            variant={viewMode === "preview" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("preview")}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Separator orientation="vertical" className="h-6 mx-2" />
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleClonePage} 
            disabled={canvasBlocks.length === 0}
            title="Clone entire page to library"
          >
            <Files className="h-4 w-4 mr-2" />
            CP
          </Button>
          <Button 
            variant={isInspectingSection ? "default" : "outline"} 
            size="sm" 
            onClick={handleCloneSection}
            disabled={canvasBlocks.length === 0}
            title="Clone selected section to library"
          >
            <FileText className="h-4 w-4 mr-2" />
            CS
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadVercelTemplates}
            disabled={loadingTemplates}
            title="Load templates from Vercel projects"
          >
            {loadingTemplates ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Cloud className="h-4 w-4 mr-2" />
            )}
            Load Vercel
          </Button>
          <Separator orientation="vertical" className="h-6 mx-2" />
          <Button variant="outline" size="sm" onClick={handleExport} disabled={canvasBlocks.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="default" size="sm" disabled={canvasBlocks.length === 0}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar - Components */}
          <div className="w-64 border-r border-border bg-card overflow-y-auto">
            <div className="p-4">
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase">Components</h3>
              <Droppable droppableId="palette" isDropDisabled>
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                    {/* Default Templates */}
                    {blockTemplates.map((template, index) => {
                      const Icon = template.icon;
                      return (
                        <Draggable
                          draggableId={`palette-${template.type}-${index}`}
                          index={index}
                          key={`palette-${template.type}-${index}`}
                        >
                          {(draggableProvided, snapshot) => (
                            <div
                              ref={draggableProvided.innerRef}
                              {...draggableProvided.draggableProps}
                              {...draggableProvided.dragHandleProps}
                              className={cn(
                                "p-3 rounded-lg border border-border bg-background cursor-grab active:cursor-grabbing transition-all hover:border-primary/50",
                                snapshot.isDragging && "shadow-lg border-primary"
                              )}
                            >
                              <div className="flex items-start gap-3">
                                <Icon className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium">{template.label}</p>
                                  <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    
                    {/* Vercel Templates */}
                    {vercelTemplates.length > 0 && (
                      <>
                        <div className="pt-4 mt-4 border-t border-border">
                          <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase">From Vercel</h3>
                        </div>
                        {vercelTemplates.map((template, index) => {
                          const Icon = template.icon;
                          const globalIndex = blockTemplates.length + index;
                          return (
                            <Draggable
                              draggableId={`vercel-${template.type}-${index}`}
                              index={globalIndex}
                              key={`vercel-${template.type}-${index}`}
                            >
                              {(draggableProvided, snapshot) => (
                                <div
                                  ref={draggableProvided.innerRef}
                                  {...draggableProvided.draggableProps}
                                  {...draggableProvided.dragHandleProps}
                                  className={cn(
                                    "p-3 rounded-lg border border-blue-300 bg-blue-50 cursor-grab active:cursor-grabbing transition-all hover:border-blue-500",
                                    snapshot.isDragging && "shadow-lg border-blue-500"
                                  )}
                                >
                                  <div className="flex items-start gap-3">
                                    <Cloud className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium">{template.label}</p>
                                      <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                      </>
                    )}
                    
                    {/* Cloned Templates */}
                    {clonedTemplates.length > 0 && (
                      <>
                        <div className="pt-4 mt-4 border-t border-border">
                          <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase">Cloned</h3>
                        </div>
                        {clonedTemplates.map((template, index) => {
                          const Icon = template.icon;
                          const globalIndex = blockTemplates.length + index;
                          return (
                            <Draggable
                              draggableId={`cloned-${template.type}-${index}`}
                              index={globalIndex}
                              key={`cloned-${template.type}-${index}`}
                            >
                              {(draggableProvided, snapshot) => (
                                <div
                                  ref={draggableProvided.innerRef}
                                  {...draggableProvided.draggableProps}
                                  {...draggableProvided.dragHandleProps}
                                  className={cn(
                                    "p-3 rounded-lg border border-primary/30 bg-primary/5 cursor-grab active:cursor-grabbing transition-all hover:border-primary/50",
                                    snapshot.isDragging && "shadow-lg border-primary"
                                  )}
                                >
                                  <div className="flex items-start gap-3">
                                    <Icon className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium">{template.label}</p>
                                      <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                      </>
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          </div>

          {/* Center Canvas */}
          <div className="flex-1 overflow-y-auto bg-muted/30">
            <div className="max-w-4xl mx-auto p-8">
              <Droppable droppableId="canvas">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      "space-y-6 min-h-[600px] transition-colors",
                      snapshot.isDraggingOver && "bg-background/50"
                    )}
                  >
                    {canvasBlocks.length === 0 && (
                      <div className="h-[600px] flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border text-center p-12">
                        <Layout className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Start Building</h3>
                        <p className="text-muted-foreground max-w-md">
                          Drag components from the left sidebar to start building your page. Click on blocks to edit their properties.
                        </p>
                        {isInspectingSection && (
                          <div className="mt-4 p-3 bg-primary/10 border border-primary/30 rounded-lg">
                            <p className="text-sm text-primary font-medium">Click on a section to clone it</p>
                          </div>
                        )}
                      </div>
                    )}
                    {isInspectingSection && canvasBlocks.length > 0 && (
                      <div className="mb-4 p-3 bg-primary/10 border border-primary/30 rounded-lg">
                        <p className="text-sm text-primary font-medium">Click on any section below to clone it to the library</p>
                      </div>
                    )}
                    {canvasBlocks.map((block, index) => (
                      <Draggable draggableId={block.id} index={index} key={block.id}>
                        {(draggableProvided, snapshot) => (
                          <div
                            ref={draggableProvided.innerRef}
                            {...draggableProvided.draggableProps}
                            className={cn(
                              "transition-all",
                              snapshot.isDragging && "opacity-50"
                            )}
                          >
                            <div className="relative group">
                              <div {...draggableProvided.dragHandleProps} className="absolute -left-8 top-4 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity">
                                <GripVertical className="h-5 w-5 text-muted-foreground" />
                              </div>
                              {renderBlock(
                                block, 
                                selectedBlockId === block.id, 
                                () => {
                                  if (isInspectingSection) {
                                    handleSectionClickForClone(block.id);
                                  } else {
                                    setSelectedBlockId(block.id);
                                  }
                                }
                              )}
                              {selectedBlockId === block.id && (
                                <div className="absolute -top-10 right-0 flex gap-1 bg-primary text-primary-foreground rounded px-2 py-1 text-xs">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDuplicateBlock(block.id);
                                    }}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteBlock(block.id);
                                    }}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          </div>

          {/* Right Sidebar - Properties */}
          <div className="w-80 border-l border-border bg-card overflow-y-auto">
            <div className="p-4">
              {selectedBlock ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase">Properties</h3>
                    <Badge variant="secondary" className="capitalize">
                      {selectedBlock.type.replace("-", " ")}
                    </Badge>
                  </div>
                  <Separator className="mb-4" />
                  <div className="space-y-4">
                    {Object.keys(selectedBlock.defaults).map((key) => (
                      <div key={key} className="space-y-2">
                        <Label className="text-xs font-medium capitalize">
                          {key.replace(/([A-Z])/g, " $1").trim()}
                        </Label>
                        {key.includes("Desc") || key.includes("quote") || key.includes("answer") ? (
                          <Textarea
                            value={selectedBlock.defaults[key]}
                            onChange={(e) => handleBlockChange(selectedBlock.id, key, e.target.value)}
                            className="min-h-[80px]"
                          />
                        ) : (
                          <Input
                            value={selectedBlock.defaults[key]}
                            onChange={(e) => handleBlockChange(selectedBlock.id, key, e.target.value)}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">Select a block to edit its properties</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DragDropContext>
    </div>
  );
};
