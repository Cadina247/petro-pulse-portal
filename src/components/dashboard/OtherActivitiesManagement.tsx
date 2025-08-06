import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Store, Car, Scissors, Coffee, ShoppingCart, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface Activity {
  id: string;
  name: string;
  available: boolean;
  icon: any;
}

const activityIcons = [Store, Car, Scissors, Coffee, ShoppingCart];

const initialActivities: Activity[] = [
  {
    id: "carwash",
    name: "Car Wash",
    available: true,
    icon: Car,
  },
  {
    id: "supermarket",
    name: "Supermarket",
    available: true,
    icon: ShoppingCart,
  },
  {
    id: "salon",
    name: "Hair Salon",
    available: false,
    icon: Scissors,
  },
];

export function OtherActivitiesManagement() {
  const [activities, setActivities] = useState<Activity[]>(initialActivities);
  const [newActivityName, setNewActivityName] = useState("");
  const { toast } = useToast();

  const handleAvailabilityChange = (id: string, available: boolean) => {
    setActivities(prev =>
      prev.map(activity =>
        activity.id === id ? { ...activity, available } : activity
      )
    );
  };

  const handleAddActivity = () => {
    if (!newActivityName.trim()) {
      toast({
        title: "Error",
        description: "Please enter an activity name",
        variant: "destructive",
      });
      return;
    }

    const newActivity: Activity = {
      id: newActivityName.toLowerCase().replace(/\s+/g, '_'),
      name: newActivityName,
      available: true,
      icon: activityIcons[Math.floor(Math.random() * activityIcons.length)],
    };

    setActivities(prev => [...prev, newActivity]);
    setNewActivityName("");
    
    toast({
      title: "Activity Added",
      description: `${newActivityName} has been added successfully.`,
    });
  };

  const handleRemoveActivity = (id: string) => {
    setActivities(prev => prev.filter(activity => activity.id !== id));
    
    toast({
      title: "Activity Removed",
      description: "Activity has been removed successfully.",
    });
  };

  const handleSaveChanges = () => {
    toast({
      title: "Changes Saved",
      description: "Activity availability has been updated successfully.",
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Store className="w-5 h-5 text-primary" />
          Other Activities Management
        </CardTitle>
        <Button onClick={handleSaveChanges} className="bg-success hover:bg-success/90">
          Save Changes
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add New Activity */}
        <div className="p-4 border border-dashed border-border rounded-lg">
          <h3 className="font-semibold mb-3">Add New Activity</h3>
          <div className="flex gap-2">
            <Input
              placeholder="Enter activity name (e.g., Restaurant, ATM, Pharmacy)"
              value={newActivityName}
              onChange={(e) => setNewActivityName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddActivity()}
              className="flex-1"
            />
            <Button onClick={handleAddActivity} size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>
        </div>

        {/* Existing Activities */}
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = activity.icon;
            
            return (
              <div key={activity.id} className="p-4 border border-border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className="w-6 h-6 text-primary" />
                    <div>
                      <h3 className="font-semibold">{activity.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Status: {activity.available ? "Operating" : "Closed"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <Badge variant={activity.available ? "default" : "secondary"}>
                      {activity.available ? "Available" : "Unavailable"}
                    </Badge>
                    
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`${activity.id}-availability`} className="text-sm">
                        Available
                      </Label>
                      <Switch
                        id={`${activity.id}-availability`}
                        checked={activity.available}
                        onCheckedChange={(checked) => handleAvailabilityChange(activity.id, checked)}
                      />
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveActivity(activity.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {activities.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Store className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No activities added yet. Add your first activity above.</p>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          Last updated: {new Date().toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
}
