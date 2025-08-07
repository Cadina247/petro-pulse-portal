import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Fuel, DollarSign } from "lucide-react";

interface PriceData {
  id: string;
  name: string;
  unit: string;
  price: number;
  icon: string;
}

const initialPriceData: PriceData[] = [
  {
    id: "1",
    name: "Petrol",
    unit: "per liter",
    price: 900,
    icon: "⛽"
  },
  {
    id: "2", 
    name: "Diesel",
    unit: "per liter",
    price: 850,
    icon: "🚛"
  },
  {
    id: "3",
    name: "Kerosene",
    unit: "per liter", 
    price: 750,
    icon: "🪔"
  },
  {
    id: "4",
    name: "Cooking Gas",
    unit: "per kg",
    price: 800,
    icon: "🔥"
  }
];

export function PricingManagement() {
  const [priceData, setPriceData] = useState<PriceData[]>(initialPriceData);
  const { toast } = useToast();

  const handlePriceChange = (id: string, newPrice: number) => {
    setPriceData(prev => 
      prev.map(item => 
        item.id === id ? { ...item, price: newPrice } : item
      )
    );
  };

  const handleSaveChanges = () => {
    toast({
      title: "Prices Updated",
      description: "All fuel prices have been successfully updated.",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Pricing Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {priceData.map((item) => (
            <div key={item.id} className="space-y-3 p-4 rounded-lg border bg-card">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <h3 className="font-medium">{item.name}</h3>
                  <p className="text-sm text-muted-foreground">{item.unit}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor={`price-${item.id}`}>Price (₦)</Label>
                <Input
                  id={`price-${item.id}`}
                  type="number"
                  value={item.price}
                  onChange={(e) => handlePriceChange(item.id, Number(e.target.value))}
                  className="text-lg font-semibold"
                />
              </div>
              
              <div className="text-sm text-muted-foreground">
                Current: ₦{item.price.toLocaleString()} {item.unit}
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex justify-end">
          <Button onClick={handleSaveChanges} className="min-w-32">
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}