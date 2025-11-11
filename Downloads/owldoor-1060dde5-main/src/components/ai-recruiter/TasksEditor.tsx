import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface TasksEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  clientId: string;
}

export const TasksEditor = ({ open, onOpenChange, leadId, clientId }: TasksEditorProps) => {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    due_date: '',
    priority: 'medium',
    task_type: 'custom',
  });

  // Load tasks
  const { data: tasks } = useQuery({
    queryKey: ['ai-tasks', leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_tasks')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (task: any) => {
      const { error } = await supabase.from('ai_tasks').insert({
        ...task,
        lead_id: leadId,
        client_id: clientId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-tasks', leadId] });
      toast.success('Task created');
      setIsAdding(false);
      setNewTask({
        title: '',
        description: '',
        due_date: '',
        priority: 'medium',
        task_type: 'custom',
      });
    },
    onError: () => {
      toast.error('Failed to create task');
    },
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { error } = await supabase
        .from('ai_tasks')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-tasks', leadId] });
      toast.success('Task updated');
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('ai_tasks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-tasks', leadId] });
      toast.success('Task deleted');
    },
  });

  const handleCreateTask = () => {
    if (!newTask.title.trim()) {
      toast.error('Task title is required');
      return;
    }
    createTaskMutation.mutate(newTask);
  };

  const toggleTaskComplete = (task: any) => {
    updateTaskMutation.mutate({
      id: task.id,
      updates: {
        status: task.status === 'completed' ? 'pending' : 'completed',
        completed_at: task.status === 'completed' ? null : new Date().toISOString(),
      },
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <AlertCircle className="h-3 w-3" />;
      case 'high': return <Clock className="h-3 w-3" />;
      default: return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Tasks & Reminders</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Add Task Button */}
          {!isAdding && (
            <Button
              onClick={() => setIsAdding(true)}
              variant="outline"
              className="mb-4 gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Task
            </Button>
          )}

          {/* Add Task Form */}
          {isAdding && (
            <div className="mb-4 p-4 border rounded-lg bg-muted/50 space-y-3">
              <div>
                <Label htmlFor="title">Task Title *</Label>
                <Input
                  id="title"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="e.g., Follow up call"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Additional details..."
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select value={newTask.task_type} onValueChange={(v) => setNewTask({ ...newTask, task_type: v })}>
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">Custom</SelectItem>
                      <SelectItem value="follow_up">Follow Up</SelectItem>
                      <SelectItem value="call">Call</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="reminder">Reminder</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={newTask.priority} onValueChange={(v) => setNewTask({ ...newTask, priority: v })}>
                    <SelectTrigger id="priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="due">Due Date</Label>
                  <Input
                    id="due"
                    type="datetime-local"
                    value={newTask.due_date}
                    onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreateTask} disabled={createTaskMutation.isPending} size="sm">
                  Create Task
                </Button>
                <Button onClick={() => setIsAdding(false)} variant="outline" size="sm">
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Tasks List */}
          <ScrollArea className="flex-1">
            <div className="space-y-2">
              {tasks?.map((task) => (
                <div
                  key={task.id}
                  className={`p-3 border rounded-lg ${
                    task.status === 'completed' ? 'bg-muted/50 opacity-75' : 'bg-background'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 mt-0.5"
                      onClick={() => toggleTaskComplete(task)}
                    >
                      <CheckCircle2
                        className={`h-4 w-4 ${
                          task.status === 'completed' ? 'text-green-500 fill-green-500' : 'text-muted-foreground'
                        }`}
                      />
                    </Button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className={`font-medium text-sm ${task.status === 'completed' ? 'line-through' : ''}`}>
                          {task.title}
                        </h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteTaskMutation.mutate(task.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      {task.description && (
                        <p className="text-xs text-muted-foreground mb-2">{task.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={getPriorityColor(task.priority)} className="text-xs gap-1">
                          {getPriorityIcon(task.priority)}
                          {task.priority}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {task.task_type.replace('_', ' ')}
                        </Badge>
                        {task.due_date && (
                          <span className="text-xs text-muted-foreground">
                            Due: {format(new Date(task.due_date), 'MMM d, h:mm a')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {tasks?.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No tasks yet. Add your first task to get started.
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
