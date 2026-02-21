import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { CalendarIcon, Clock, Plus, Trash2, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  description?: string;
  due_date: string;
  priority: string;
  status: string;
  assigned_by?: string;
  assigned_to?: string;
}

interface CalendarTaskManagerProps {
  userId: string;
}

export const CalendarTaskManager = ({ userId }: CalendarTaskManagerProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    priority: 'medium',
    status: 'pending'
  });

  useEffect(() => {
    fetchTasks();
  }, [userId]);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('work_assignments')
        .select('*')
        .or(`assigned_by.eq.${userId},assigned_to.eq.${userId}`)
        .order('due_date', { ascending: true });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load tasks');
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      if (!task.due_date) return false;
      const taskDate = new Date(task.due_date);
      return taskDate.toDateString() === date.toDateString();
    });
  };

  const openCreateDialog = () => {
    setEditingTask(null);
    setFormData({
      title: '',
      description: '',
      due_date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '',
      priority: 'medium',
      status: 'pending'
    });
    setDialogOpen(true);
  };

  const openEditDialog = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      due_date: task.due_date ? format(new Date(task.due_date), 'yyyy-MM-dd') : '',
      priority: task.priority,
      status: task.status
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.due_date) {
      toast.error('Please fill in title and due date');
      return;
    }

    try {
      if (editingTask) {
        const { error } = await supabase
          .from('work_assignments')
          .update({
            title: formData.title.trim(),
            description: formData.description.trim() || null,
            due_date: formData.due_date,
            priority: formData.priority,
            status: formData.status
          })
          .eq('id', editingTask.id);

        if (error) throw error;
        toast.success('Task updated successfully');
      } else {
        const { error } = await supabase
          .from('work_assignments')
          .insert({
            title: formData.title.trim(),
            description: formData.description.trim() || null,
            due_date: formData.due_date,
            priority: formData.priority,
            status: formData.status,
            assigned_by: userId,
            assigned_to: userId
          });

        if (error) throw error;
        toast.success('Task created successfully');
      }

      setDialogOpen(false);
      fetchTasks();
    } catch (error) {
      console.error('Error saving task:', error);
      toast.error('Failed to save task');
    }
  };

  const handleDelete = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('work_assignments')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      toast.success('Task deleted successfully');
      fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'in_progress': return 'secondary';
      case 'pending': return 'outline';
      default: return 'outline';
    }
  };

  const selectedDateTasks = selectedDate ? getTasksForDate(selectedDate) : [];

  return (
    <>
      <Card className="glass-effect">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarIcon className="h-4 w-4 text-primary" />
                Task Calendar
              </CardTitle>
              <CardDescription className="text-sm">
                Schedule and manage tasks
              </CardDescription>
            </div>
            <Button 
              onClick={openCreateDialog}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Compact Calendar */}
            <div className="md:col-span-2">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                className={cn("rounded-md border pointer-events-auto p-2")}
                modifiers={{
                  hasTask: (date) => getTasksForDate(date).length > 0
                }}
                modifiersStyles={{
                  hasTask: {
                    fontWeight: 'bold',
                    backgroundColor: 'hsl(var(--primary) / 0.1)',
                    color: 'hsl(var(--primary))'
                  }
                }}
              />
            </div>

            {/* Compact Tasks List */}
            <div className="md:col-span-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">
                  {selectedDate ? format(selectedDate, 'MMM dd, yyyy') : 'Select date'}
                </h3>
                {selectedDateTasks.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {selectedDateTasks.length} task{selectedDateTasks.length !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>

              <div className="space-y-2 max-h-[280px] overflow-y-auto">
                {selectedDateTasks.length > 0 ? (
                  selectedDateTasks.map((task) => (
                    <div key={task.id} className="p-3 border border-border/50 rounded-lg hover:bg-accent/5 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{task.title}</h4>
                          {task.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                              {task.description}
                            </p>
                          )}
                          <div className="flex gap-1 mt-2">
                            <Badge variant={getPriorityColor(task.priority)} className="text-xs px-1.5 py-0">
                              {task.priority}
                            </Badge>
                            <Badge variant={getStatusColor(task.status)} className="text-xs px-1.5 py-0">
                              {task.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-0.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditDialog(task)}
                            className="h-7 w-7 p-0"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(task.id)}
                            className="h-7 w-7 p-0"
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No tasks for this date
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Task Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg">
              {editingTask ? 'Edit Task' : 'New Task'}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {editingTask ? 'Update task details' : 'Create a task on your calendar'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <Label htmlFor="task-title" className="text-sm">Title *</Label>
              <Input
                id="task-title"
                placeholder="Task title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="text-sm"
              />
            </div>

            <div>
              <Label htmlFor="task-description" className="text-sm">Description</Label>
              <Textarea
                id="task-description"
                placeholder="Task description..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
                className="text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="task-date" className="text-sm">Due Date *</Label>
                <Input
                  id="task-date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                  className="text-sm"
                />
              </div>

              <div>
                <Label htmlFor="task-priority" className="text-sm">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="task-status" className="text-sm">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-3">
              <Button onClick={handleSubmit} className="flex-1" size="sm">
                {editingTask ? 'Update' : 'Create'}
              </Button>
              <Button 
                variant="outline"
                onClick={() => setDialogOpen(false)}
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
