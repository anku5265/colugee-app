import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Target, Plus, CheckCircle, Clock, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Goal {
  id: string;
  title: string;
  status: "active" | "completed";
  dueDate: string;
}

export const GoalManager = () => {
  const [goals, setGoals] = useState<Goal[]>([
    { id: "1", title: "Complete React course", status: "active", dueDate: "2024-01-15" },
    { id: "2", title: "Build portfolio website", status: "completed", dueDate: "2024-01-10" },
    { id: "3", title: "Learn TypeScript", status: "active", dueDate: "2024-01-20" },
  ]);
  
  const [newGoal, setNewGoal] = useState({ title: "", dueDate: "" });
  const [isOpen, setIsOpen] = useState(false);

  const addGoal = () => {
    if (newGoal.title && newGoal.dueDate) {
      setGoals([...goals, {
        id: Date.now().toString(),
        title: newGoal.title,
        status: "active",
        dueDate: newGoal.dueDate
      }]);
      setNewGoal({ title: "", dueDate: "" });
      setIsOpen(false);
    }
  };

  const toggleGoalStatus = (id: string) => {
    setGoals(goals.map(goal => 
      goal.id === id 
        ? { ...goal, status: goal.status === "active" ? "completed" : "active" }
        : goal
    ));
  };

  const deleteGoal = (id: string) => {
    setGoals(goals.filter(goal => goal.id !== id));
  };

  const activeGoals = goals.filter(goal => goal.status === "active");
  const completedGoals = goals.filter(goal => goal.status === "completed");

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10" />
      <CardHeader className="relative">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-primary" />
            <span>My Goals</span>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Goal</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="goal-title">Goal Title</Label>
                  <Input
                    id="goal-title"
                    value={newGoal.title}
                    onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
                    placeholder="Enter your goal"
                  />
                </div>
                <div>
                  <Label htmlFor="goal-date">Due Date</Label>
                  <Input
                    id="goal-date"
                    type="date"
                    value={newGoal.dueDate}
                    onChange={(e) => setNewGoal({...newGoal, dueDate: e.target.value})}
                  />
                </div>
                <Button onClick={addGoal} className="w-full">
                  Add Goal
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent className="relative">
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-foreground">Active Goals</h4>
              <Badge variant="secondary">{activeGoals.length}</Badge>
            </div>
            <div className="space-y-2">
              {activeGoals.slice(0, 2).map((goal) => (
                <div key={goal.id} className="flex items-center justify-between p-2 bg-card/50 rounded">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-amber-500" />
                    <span className="text-sm">{goal.title}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleGoalStatus(goal.id)}
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteGoal(goal.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-foreground">Completed</h4>
              <Badge variant="default">{completedGoals.length}</Badge>
            </div>
            <div className="space-y-2">
              {completedGoals.slice(0, 1).map((goal) => (
                <div key={goal.id} className="flex items-center justify-between p-2 bg-green-500/10 rounded">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm line-through">{goal.title}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};