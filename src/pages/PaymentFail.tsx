import React from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";

const PaymentFail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const reason = searchParams.get("reason");

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-md w-full text-center">
        <CardContent className="pt-8 pb-6 space-y-4">
          <XCircle className="h-16 w-16 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold">
            {reason === "cancelled" ? "পেমেন্ট বাতিল হয়েছে" : "পেমেন্ট ব্যর্থ হয়েছে"}
          </h1>
          <p className="text-muted-foreground">
            {reason === "cancelled"
              ? "তুমি পেমেন্ট বাতিল করেছো। আবার চেষ্টা করতে পারো।"
              : "পেমেন্ট প্রক্রিয়ায় সমস্যা হয়েছে। আবার চেষ্টা করো।"}
          </p>
          <div className="flex gap-2">
            <Link to="/pricing" className="flex-1">
              <Button variant="outline" className="w-full">আবার চেষ্টা করো</Button>
            </Link>
            <Link to="/dashboard" className="flex-1">
              <Button className="w-full">ড্যাশবোর্ড</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentFail;
