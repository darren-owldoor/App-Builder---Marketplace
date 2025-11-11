import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Mail, Phone, FileText, Send, Menu, Plus } from "lucide-react";
import { toast } from "sonner";
import FieldSelector from "@/components/campaigns/FieldSelector";

interface Lead {
  id: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  company?: string;
  brokerage?: string;
  status: string;
  pipeline_stage?: string;
  image_url?: string;
  lead_type?: string;
}

interface Client {
  id: string;
  contact_name: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string;
  company_name: string;
  client_type: string;
  user_id: string;
}

interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  type: 'lead' | 'client';
  subType?: string;
  status?: string;
  pipeline_stage?: string;
  image_url?: string;
  lastMessageAt?: string;
  lastMessageType?: string;
}

interface Conversation {
  id: string;
  pro_id: string;
  client_id?: string;
  message_type: string;
  message_content: string;
  created_at: string;
  sent_by: string;
  metadata?: any;
}

interface MessageTemplate {
  id: string;
  template_name: string;
  template_type: string;
  template_content: string;
}

export default function Conversations() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [activeTab, setActiveTab] = useState("sms");
  const [aiMode, setAiMode] = useState("off");
  const [showFullLead, setShowFullLead] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showTemplatesPopover, setShowTemplatesPopover] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: "", type: "sms", content: "" });
  const [filterContactType, setFilterContactType] = useState("all"); // all, lead, client
  const [filterSubType, setFilterSubType] = useState("all");
  const [filterMessageType, setFilterMessageType] = useState("all"); // all, sms, email
  const [searchQuery, setSearchQuery] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const templateContentRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (isAdmin && !isLoading) {
      fetchContacts();
      fetchTemplates();
    }
  }, [isAdmin, isLoading]);

  useEffect(() => {
    if (selectedContact) {
      fetchConversations(selectedContact.id, selectedContact.type);
    }
  }, [selectedContact]);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Please log in to access this page");
        navigate("/auth");
        return;
      }

      // Check if user has admin or staff role
      const { data: roles, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .in("role", ["admin", "staff"]);

      if (error || !roles || roles.length === 0) {
        toast.error("Access denied. This page is for administrators only.");
        navigate("/");
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error("Error checking admin access:", error);
      toast.error("Error verifying access");
      navigate("/");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchContacts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Check if user is admin/staff or client
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const isAdminOrStaff = roles?.some(r => r.role === 'admin' || r.role === 'staff');

    if (isAdminOrStaff) {
      // Admin/Staff can see all pros and clients
      const { data: leadsData, error: leadsError } = await supabase
        .from("pros")
        .select("*")
        .order("created_at", { ascending: false });

      if (leadsError) {
        toast.error("Failed to fetch leads");
        return;
      }

      const { data: clientsData, error: clientsError } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });

      if (clientsError) {
        toast.error("Failed to fetch clients");
        return;
      }

      // Fetch all conversations to get last message info
      const { data: allConversations } = await supabase
        .from("conversations")
        .select("pro_id, client_id, message_type, created_at")
        .order("created_at", { ascending: false });

      const conversationMap = new Map<string, { date: string; type: string }>();
      allConversations?.forEach(conv => {
        const key = conv.pro_id || conv.client_id;
        if (key && !conversationMap.has(key)) {
          conversationMap.set(key, { date: conv.created_at, type: conv.message_type });
        }
      });

      // Transform leads to contacts
      const leadContacts: Contact[] = (leadsData || []).map((lead: Lead) => {
        const lastMessage = conversationMap.get(lead.id);
        return {
          id: lead.id,
          name: lead.full_name,
          email: lead.email,
          phone: lead.phone,
          company: lead.company || lead.brokerage,
          type: 'lead' as const,
          subType: lead.lead_type || 'unknown',
          status: lead.status,
          pipeline_stage: lead.pipeline_stage,
          image_url: lead.image_url,
          lastMessageAt: lastMessage?.date,
          lastMessageType: lastMessage?.type,
        };
      });

      // Transform clients to contacts
      const clientContacts: Contact[] = (clientsData || []).map((client: Client) => {
        const lastMessage = conversationMap.get(client.id);
        return {
          id: client.id,
          name: client.contact_name || `${client.first_name || ''} ${client.last_name || ''}`.trim(),
          email: client.email,
          phone: client.phone,
          company: client.company_name,
          type: 'client' as const,
          subType: client.client_type,
          lastMessageAt: lastMessage?.date,
          lastMessageType: lastMessage?.type,
        };
      });

      const allContacts = [...leadContacts, ...clientContacts];
      setContacts(allContacts);
      
      if (allContacts.length > 0) {
        setSelectedContact(allContacts[0]);
      }
    } else {
      // Regular client - only show their own leads
      const { data: clientRecord } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!clientRecord) {
        toast.error("Client profile not found");
        return;
      }

      // Fetch pros that are matched with this client
      const { data: matchesData } = await supabase
        .from("matches")
        .select("pro_id")
        .eq("client_id", clientRecord.id);

      const proIds = matchesData?.map(m => m.pro_id) || [];

      if (proIds.length === 0) {
        setContacts([]);
        return;
      }

      const { data: leadsData, error: leadsError } = await supabase
        .from("pros")
        .select("*")
        .in("id", proIds)
        .order("created_at", { ascending: false });

      if (leadsError) {
        toast.error("Failed to fetch leads");
        return;
      }

      // Fetch conversations for this client
      const { data: clientConversations } = await supabase
        .from("conversations")
        .select("pro_id, message_type, created_at")
        .eq("client_id", clientRecord.id)
        .order("created_at", { ascending: false });

      const conversationMap = new Map<string, { date: string; type: string }>();
      clientConversations?.forEach(conv => {
        if (conv.pro_id && !conversationMap.has(conv.pro_id)) {
          conversationMap.set(conv.pro_id, { date: conv.created_at, type: conv.message_type });
        }
      });

      // Transform leads to contacts
      const leadContacts: Contact[] = (leadsData || []).map((lead: Lead) => {
        const lastMessage = conversationMap.get(lead.id);
        return {
          id: lead.id,
          name: lead.full_name,
          email: lead.email,
          phone: lead.phone,
          company: lead.company || lead.brokerage,
          type: 'lead' as const,
          subType: lead.lead_type || 'unknown',
          status: lead.status,
          pipeline_stage: lead.pipeline_stage,
          image_url: lead.image_url,
          lastMessageAt: lastMessage?.date,
          lastMessageType: lastMessage?.type,
        };
      });

      setContacts(leadContacts);
      
      if (leadContacts.length > 0) {
        setSelectedContact(leadContacts[0]);
      }
    }
  };

  const fetchConversations = async (contactId: string, contactType: 'lead' | 'client') => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Check if user is admin/staff
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const isAdminOrStaff = roles?.some(r => r.role === 'admin' || r.role === 'staff');

    let query = supabase
      .from("conversations")
      .select("*")
      .order("created_at", { ascending: true });

    if (contactType === 'lead') {
      query = query.eq("pro_id", contactId);
    } else {
      query = query.eq("client_id", contactId);
    }

    // If not admin/staff, also filter by their client_id
    if (!isAdminOrStaff) {
      const { data: clientRecord } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (clientRecord) {
        query = query.eq("client_id", clientRecord.id);
      }
    }

    const { data, error } = await query;

    if (error) {
      toast.error("Failed to fetch conversations");
      return;
    }
    setConversations(data || []);
  };

  const fetchTemplates = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("message_templates")
      .select("*")
      .eq("user_id", user.id)
      .eq("active", true);

    if (error) {
      toast.error("Failed to fetch templates");
      return;
    }
    setTemplates(data || []);
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedContact) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const insertData: any = {
      message_type: activeTab,
      message_content: messageInput,
      sent_by: user.id,
    };

    if (selectedContact.type === 'lead') {
      insertData.pro_id = selectedContact.id;
    } else {
      insertData.client_id = selectedContact.id;
    }

    // Save to conversations table
    const { error } = await supabase.from("conversations").insert(insertData);

    if (error) {
      toast.error("Failed to send message");
      return;
    }

    // Actually send the message via edge functions
    try {
      if (activeTab === "sms") {
        if (!selectedContact.phone) {
          toast.error("Contact has no phone number");
          return;
        }
        const { error: smsError } = await supabase.functions.invoke("send-sms-provider", {
          body: {
            to: selectedContact.phone,
            message: messageInput,
            context: 'admin',
          },
        });
        if (smsError) throw smsError;
      } else if (activeTab === "email") {
        if (!selectedContact.email) {
          toast.error("Contact has no email address");
          return;
        }
        const { error: emailError } = await supabase.functions.invoke("send-email-sendgrid", {
          body: {
            to: selectedContact.email,
            subject: `Message from ${user.email}`,
            text: messageInput,
            context: 'admin',
          },
        });
        if (emailError) throw emailError;
      }
    } catch (err: any) {
      toast.error(`Failed to send ${activeTab}: ${err.message}`);
      return;
    }

    setMessageInput("");
    fetchConversations(selectedContact.id, selectedContact.type);
    toast.success(`${activeTab === "sms" ? "SMS" : "Email"} sent successfully`);
  };

  const handleCreateTemplate = async () => {
    if (!newTemplate.name || !newTemplate.content) {
      toast.error("Please fill in all fields");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("message_templates").insert({
      user_id: user.id,
      template_name: newTemplate.name,
      template_type: newTemplate.type,
      template_content: newTemplate.content,
    });

    if (error) {
      toast.error("Failed to create template");
      return;
    }

    toast.success("Template created");
    setShowTemplateModal(false);
    setShowTemplatesPopover(false);
    setNewTemplate({ name: "", type: "sms", content: "" });
    fetchTemplates();
  };

  const handleTemplateSelect = (template: MessageTemplate) => {
    setMessageInput(template.template_content);
    setShowTemplatesPopover(false);
    toast.success("Template loaded");
  };

  const handleInsertField = (field: string) => {
    const textarea = templateContentRef.current;
    if (!textarea) {
      setNewTemplate({ ...newTemplate, content: newTemplate.content + field });
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = newTemplate.content;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    
    setNewTemplate({ ...newTemplate, content: before + field + after });
    
    // Set cursor position after the inserted field
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + field.length, start + field.length);
    }, 0);
  };

  const getInitials = (contact: Contact) => {
    return contact.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const filteredContacts = contacts.filter(contact => {
    // Search filter
    const matchesSearch = 
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.company?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Contact type filter (lead/client)
    const matchesContactType = 
      filterContactType === "all" || 
      contact.type === filterContactType;
    
    // Sub-type filter (lead_type or client_type)
    const matchesSubType = 
      filterSubType === "all" || 
      contact.subType === filterSubType;
    
    // Message type filter
    const matchesMessageType = 
      filterMessageType === "all" || 
      contact.lastMessageType === filterMessageType;
    
    return matchesSearch && matchesContactType && matchesSubType && matchesMessageType;
  });

  // Sort by newest messages if filter is active
  const sortedContacts = filterMessageType !== "all" 
    ? [...filteredContacts].sort((a, b) => {
        if (!a.lastMessageAt) return 1;
        if (!b.lastMessageAt) return -1;
        return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
      })
    : filteredContacts;

  const getMessageIcon = (type: string) => {
    switch (type) {
      case "sms": return <MessageSquare className="w-4 h-4" />;
      case "email": return <Mail className="w-4 h-4" />;
      case "call": return <Phone className="w-4 h-4" />;
      case "note": return <FileText className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Conversations</h1>
          <Button variant="ghost" onClick={() => navigate(-1)}>Back</Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Contacts List - 2/3 */}
        <div className="w-2/3 border-r flex flex-col">
          <div className="p-4 border-b space-y-4">
            <Input
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            
            <div className="space-y-2">
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={filterContactType === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterContactType("all")}
                >
                  All Contacts
                </Button>
                <Button
                  variant={filterContactType === "lead" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterContactType("lead")}
                >
                  Leads
                </Button>
                <Button
                  variant={filterContactType === "client" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterContactType("client")}
                >
                  Clients
                </Button>
              </div>

              <div className="flex gap-2 flex-wrap">
                <Select value={filterSubType} onValueChange={setFilterSubType}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="real_estate">Real Estate</SelectItem>
                    <SelectItem value="mortgage">Mortgage</SelectItem>
                    <SelectItem value="insurance">Insurance</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterMessageType} onValueChange={setFilterMessageType}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Message type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Messages</SelectItem>
                    <SelectItem value="sms">Latest SMS</SelectItem>
                    <SelectItem value="email">Latest Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-2">
              {sortedContacts.map((contact) => (
                <Card
                  key={contact.id}
                  className={`p-4 cursor-pointer transition-colors hover:bg-accent ${
                    selectedContact?.id === contact.id ? "bg-accent" : ""
                  }`}
                  onClick={() => setSelectedContact(contact)}
                >
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarImage src={contact.image_url} />
                      <AvatarFallback>{getInitials(contact)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold truncate">{contact.name}</h3>
                        <div className="flex gap-1">
                          <Badge variant={contact.type === 'lead' ? 'default' : 'secondary'}>
                            {contact.type}
                          </Badge>
                          {contact.status && (
                            <Badge variant="outline">{contact.status}</Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {contact.company || contact.email}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {contact.subType && (
                          <Badge variant="secondary" className="text-xs">
                            {contact.subType}
                          </Badge>
                        )}
                        {contact.pipeline_stage && (
                          <Badge variant="secondary" className="text-xs">
                            {contact.pipeline_stage}
                          </Badge>
                        )}
                        {contact.lastMessageAt && (
                          <span className="text-xs text-muted-foreground">
                            {getMessageIcon(contact.lastMessageType || '')}
                            {' '}
                            {new Date(contact.lastMessageAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Interface - 1/3 */}
        <div className="w-1/3 flex flex-col">
          {selectedContact ? (
            <>
              <div className="p-4 border-b">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={selectedContact.image_url} />
                    <AvatarFallback>{getInitials(selectedContact)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">{selectedContact.name}</h3>
                      <Badge variant={selectedContact.type === 'lead' ? 'default' : 'secondary'}>
                        {selectedContact.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {selectedContact.company}
                    </p>
                  </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="note">
                      <FileText className="w-4 h-4 mr-1" />
                      Notes
                    </TabsTrigger>
                    <TabsTrigger value="sms">
                      <MessageSquare className="w-4 h-4 mr-1" />
                      SMS
                    </TabsTrigger>
                    <TabsTrigger value="email">
                      <Mail className="w-4 h-4 mr-1" />
                      Email
                    </TabsTrigger>
                    <TabsTrigger value="call">
                      <Phone className="w-4 h-4 mr-1" />
                      Call
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {conversations
                    .filter((conv) => conv.message_type === activeTab)
                    .map((conv) => (
                      <div key={conv.id} className="flex gap-2">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                          {getMessageIcon(conv.message_type)}
                        </div>
                        <div className="flex-1">
                          <div className="bg-muted rounded-lg p-3">
                            <p className="text-sm">{conv.message_content}</p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(conv.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </ScrollArea>

              <div className="p-4 border-t space-y-3">
                <div className="flex gap-2">
                  <Popover open={showTemplatesPopover} onOpenChange={setShowTemplatesPopover}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Menu className="w-4 h-4 mr-1" />
                        Templates
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-2" align="start">
                      <div className="space-y-1">
                        <Button
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={() => {
                            setShowTemplatesPopover(false);
                            setShowTemplateModal(true);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Create Template
                        </Button>
                        {templates.length > 0 && (
                          <>
                            <Separator className="my-2" />
                            <div className="max-h-64 overflow-y-auto">
                              {templates.map((template) => (
                                <Button
                                  key={template.id}
                                  variant="ghost"
                                  className="w-full justify-start text-left"
                                  onClick={() => handleTemplateSelect(template)}
                                >
                                  <div className="flex flex-col items-start overflow-hidden">
                                    <span className="font-medium truncate w-full">
                                      {template.template_name}
                                    </span>
                                    <span className="text-xs text-muted-foreground truncate w-full">
                                      {template.template_content.substring(0, 40)}...
                                    </span>
                                  </div>
                                </Button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>

                  <Dialog open={showTemplateModal} onOpenChange={setShowTemplateModal}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create Message Template</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Input
                          placeholder="Template Name"
                          value={newTemplate.name}
                          onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                        />
                        <Select
                          value={newTemplate.type}
                          onValueChange={(value) => setNewTemplate({ ...newTemplate, type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sms">SMS</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="note">Note</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="space-y-2">
                          <FieldSelector onInsert={handleInsertField} />
                          <Textarea
                            ref={templateContentRef}
                            placeholder="Template Content"
                            value={newTemplate.content}
                            onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                            rows={4}
                          />
                        </div>
                        <Button onClick={handleCreateTemplate} className="w-full">
                          Create Template
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Select value={aiMode} onValueChange={setAiMode}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="AI Mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="off">AI: OFF</SelectItem>
                      <SelectItem value="on">AI: ON</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFullLead(true)}
                  >
                    Full Contact
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Textarea
                    placeholder={`Type a ${activeTab}...`}
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    rows={2}
                  />
                  <Button onClick={handleSendMessage} size="icon">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <Dialog open={showFullLead} onOpenChange={setShowFullLead}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Full Contact Details</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={selectedContact.image_url} />
                        <AvatarFallback>{getInitials(selectedContact)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-2xl font-bold">{selectedContact.name}</h2>
                          <Badge variant={selectedContact.type === 'lead' ? 'default' : 'secondary'}>
                            {selectedContact.type}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground">
                          {selectedContact.company}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-semibold">Email</p>
                        <p className="text-sm text-muted-foreground">{selectedContact.email || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Phone</p>
                        <p className="text-sm text-muted-foreground">{selectedContact.phone || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Type</p>
                        <Badge>{selectedContact.subType || "N/A"}</Badge>
                      </div>
                      {selectedContact.status && (
                        <div>
                          <p className="text-sm font-semibold">Status</p>
                          <Badge>{selectedContact.status}</Badge>
                        </div>
                      )}
                      {selectedContact.pipeline_stage && (
                        <div>
                          <p className="text-sm font-semibold">Pipeline Stage</p>
                          <Badge variant="secondary">{selectedContact.pipeline_stage}</Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Select a contact to view conversations
            </div>
          )}
        </div>
      </div>
    </div>
  );
}