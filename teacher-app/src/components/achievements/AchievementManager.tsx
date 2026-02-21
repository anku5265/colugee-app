import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Award, Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const AchievementManager = () => {
  const [achievements, setAchievements] = useState([
    "Dean's List 2023",
    "Programming Contest Winner"
  ]);
  
  const [certificates, setCertificates] = useState([
    "AWS Cloud Practitioner",
    "React Developer Certification"
  ]);
  
  const [newItem, setNewItem] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("achievements");

  const addItem = () => {
    if (newItem.trim()) {
      if (activeTab === "achievements") {
        setAchievements([...achievements, newItem.trim()]);
      } else {
        setCertificates([...certificates, newItem.trim()]);
      }
      setNewItem("");
      setIsOpen(false);
    }
  };

  const removeItem = (index: number, type: "achievements" | "certificates") => {
    if (type === "achievements") {
      setAchievements(achievements.filter((_, i) => i !== index));
    } else {
      setCertificates(certificates.filter((_, i) => i !== index));
    }
  };

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-orange-500/10" />
      <CardHeader className="relative">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Award className="h-5 w-5 text-yellow-600" />
            <span>Achievements</span>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New {activeTab === "achievements" ? "Achievement" : "Certificate"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="achievements">Achievement</TabsTrigger>
                    <TabsTrigger value="certificates">Certificate</TabsTrigger>
                  </TabsList>
                </Tabs>
                <div>
                  <Label htmlFor="new-item">
                    {activeTab === "achievements" ? "Achievement" : "Certificate"} Name
                  </Label>
                  <Input
                    id="new-item"
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    placeholder={`Enter ${activeTab === "achievements" ? "achievement" : "certificate"} name`}
                  />
                </div>
                <Button onClick={addItem} className="w-full">
                  Add {activeTab === "achievements" ? "Achievement" : "Certificate"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent className="relative">
        <Tabs defaultValue="achievements" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="certificates">Certificates</TabsTrigger>
          </TabsList>
          
          <TabsContent value="achievements" className="space-y-2">
            {achievements.map((achievement, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-yellow-500/10 rounded">
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  {achievement}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(index, "achievements")}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            {achievements.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No achievements added yet
              </p>
            )}
          </TabsContent>
          
          <TabsContent value="certificates" className="space-y-2">
            {certificates.map((certificate, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-blue-500/10 rounded">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {certificate}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(index, "certificates")}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            {certificates.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No certificates added yet
              </p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};