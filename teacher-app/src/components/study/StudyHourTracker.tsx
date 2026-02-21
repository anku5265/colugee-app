import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clock, Plus, Target } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const StudyHourTracker = () => {
  const [studyGoal, setStudyGoal] = useState({ hours: 40, period: "weekly" });
  const [currentHours, setCurrentHours] = useState(24);
  const [isOpen, setIsOpen] = useState(false);

  const updateGoal = (hours: string, period: string) => {
    setStudyGoal({ hours: parseInt(hours) || 0, period });
    setIsOpen(false);
  };

  const progressPercentage = (currentHours / studyGoal.hours) * 100;

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-blue-500/10" />
      <CardHeader className="relative">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-accent" />
            <span>Study Hours</span>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <Target className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Set Study Goal</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="study-hours">Target Hours</Label>
                  <Input
                    id="study-hours"
                    type="number"
                    defaultValue={studyGoal.hours}
                    placeholder="Enter hours"
                  />
                </div>
                <div>
                  <Label htmlFor="study-period">Period</Label>
                  <Select defaultValue={studyGoal.period}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={() => {
                    const hoursInput = document.getElementById('study-hours') as HTMLInputElement;
                    const periodSelect = document.querySelector('[data-state="open"]')?.getAttribute('data-value') || studyGoal.period;
                    updateGoal(hoursInput.value, periodSelect);
                  }} 
                  className="w-full"
                >
                  Update Goal
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent className="relative">
        <div className="text-center">
          <div className="text-2xl font-bold text-foreground mb-1">
            {currentHours}h / {studyGoal.hours}h
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            {studyGoal.period} goal ({Math.round(progressPercentage)}%)
          </p>
          <div className="w-full bg-muted rounded-full h-2 mb-3">
            <div 
              className="bg-accent h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
          </div>
          <Button size="sm" variant="outline" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Log Study Time
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};