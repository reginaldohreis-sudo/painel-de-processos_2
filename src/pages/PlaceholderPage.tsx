import { Button } from "@/components/ui/Button";
import { Card, CardContent } from '@/components/ui/Card';
import { Plus } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  buttonText: string;
}

export function PlaceholderPage({ title, buttonText }: PlaceholderPageProps) {
  return (
    <div className="space-y-8">
        <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold text-foreground">{title}</h2>
            <Button>
                <Plus className="mr-2 h-4 w-4" />
                {buttonText}
            </Button>
        </div>
        <Card className="flex items-center justify-center min-h-[400px]">
            <CardContent className="text-center p-6">
                <h3 className="text-lg font-medium text-foreground">Em Construção</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                    Esta página está sendo desenvolvida. A funcionalidade completa será implementada em breve.
                </p>
            </CardContent>
        </Card>
    </div>
  );
}
