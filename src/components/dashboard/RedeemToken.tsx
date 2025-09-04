import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Printer, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface TokenData {
  id: string;
  code: string;
  value_cents: number;
  currency: string;
  status: string;
  created_at: string;
}

export const RedeemToken = () => {
  const [tokenCode, setTokenCode] = useState("");
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);

  const handleLookupToken = async () => {
    if (!tokenCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a token code",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("tokens")
        .select("*")
        .eq("code", tokenCode.trim())
        .single();

      if (error) {
        toast({
          title: "Token Not Found",
          description: "Invalid token code or token does not exist",
          variant: "destructive",
        });
        setTokenData(null);
        return;
      }

      setTokenData(data);
      
      if (data.status === "redeemed") {
        toast({
          title: "Token Already Redeemed",
          description: "This token has already been used",
          variant: "destructive",
        });
      } else if (data.status === "void") {
        toast({
          title: "Token Void",
          description: "This token has been voided and cannot be used",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to lookup token",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRedeemToken = async () => {
    if (!tokenData || tokenData.status !== "issued") return;

    setIsRedeeming(true);
    try {
      const { error } = await supabase
        .from("tokens")
        .update({
          status: "redeemed",
          redeemed_at: new Date().toISOString(),
        })
        .eq("id", tokenData.id);

      if (error) {
        toast({
          title: "Redemption Failed",
          description: "Failed to redeem token. Please try again.",
          variant: "destructive",
        });
        return;
      }

      setTokenData({ ...tokenData, status: "redeemed" });
      toast({
        title: "Token Redeemed Successfully",
        description: "The token has been processed and is ready for printing",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to redeem token",
        variant: "destructive",
      });
    } finally {
      setIsRedeeming(false);
    }
  };

  const handlePrintReceipt = () => {
    if (!tokenData) return;

    const receiptContent = `
      FILLING STATION RECEIPT
      =====================
      
      Token Code: ${tokenData.code}
      Value: ${tokenData.currency} ${(tokenData.value_cents / 100).toFixed(2)}
      Status: ${tokenData.status.toUpperCase()}
      Redeemed: ${new Date().toLocaleString()}
      
      =====================
      Thank you for your business!
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Token Receipt</title>
            <style>
              body { font-family: monospace; white-space: pre-wrap; margin: 20px; }
            </style>
          </head>
          <body>${receiptContent}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const resetForm = () => {
    setTokenCode("");
    setTokenData(null);
  };

  const formatValue = (valueCents: number, currency: string) => {
    return `${currency} ${(valueCents / 100).toFixed(2)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "issued":
        return "bg-blue-500";
      case "redeemed":
        return "bg-green-500";
      case "void":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Redeem Token
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tokenCode">Token Code</Label>
            <div className="flex gap-2">
              <Input
                id="tokenCode"
                placeholder="Enter token code"
                value={tokenCode}
                onChange={(e) => setTokenCode(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleLookupToken} disabled={isLoading}>
                {isLoading ? "Looking up..." : "Lookup"}
              </Button>
            </div>
          </div>
        </div>

        {tokenData && (
          <>
            <Separator />
            <div className="space-y-4">
              <h3 className="font-semibold">Token Details</h3>
              <div className="grid gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Code:</span>
                  <span className="font-mono">{tokenData.code}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Value:</span>
                  <span className="text-lg font-semibold text-primary">
                    {formatValue(tokenData.value_cents, tokenData.currency)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge className={getStatusColor(tokenData.status)}>
                    {tokenData.status === "issued" && <CheckCircle className="h-3 w-3 mr-1" />}
                    {tokenData.status === "redeemed" && <CheckCircle className="h-3 w-3 mr-1" />}
                    {tokenData.status === "void" && <XCircle className="h-3 w-3 mr-1" />}
                    {tokenData.status.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Issued:</span>
                  <span className="text-sm">
                    {new Date(tokenData.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex gap-2">
              {tokenData.status === "issued" && (
                <Button
                  onClick={handleRedeemToken}
                  disabled={isRedeeming}
                  className="flex-1"
                >
                  {isRedeeming ? "Redeeming..." : "Redeem Token"}
                </Button>
              )}
              
              {tokenData.status === "redeemed" && (
                <Button onClick={handlePrintReceipt} className="flex-1">
                  <Printer className="h-4 w-4 mr-2" />
                  Print Receipt
                </Button>
              )}
              
              <Button variant="outline" onClick={resetForm}>
                New Token
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};