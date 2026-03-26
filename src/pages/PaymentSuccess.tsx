import React from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const plan = searchParams.get("plan");
  const tranId = searchParams.get("tran_id");

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-md w-full text-center">
        <CardContent className="pt-8 pb-6 space-y-4">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
          <h1 className="text-2xl font-bold">পেমেন্ট সফল হয়েছে! 🎉</h1>
          <p className="text-muted-foreground">
            তোমার <span className="font-semibold capitalize">{plan}</span> প্ল্যান সক্রিয় হয়ে গেছে।
          </p>
          {tranId && (
            <p className="text-xs text-muted-foreground">
              Transaction ID: {tranId}
            </p>
          )}
          <Link to="/dashboard">
            <Button className="w-full mt-4">ড্যাশবোর্ডে যাও</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;
