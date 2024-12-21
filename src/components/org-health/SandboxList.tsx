import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";

interface SandboxInfo {
  Id: string;
  SandboxName: string;
  LicenseType: string;
  Description: string;
}

interface SandboxListProps {
  sandboxes: SandboxInfo[];
}

export const SandboxList = ({ sandboxes }: SandboxListProps) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Active Sandboxes</h2>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="h-8 w-8"
        >
          {isOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>

      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleContent>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {sandboxes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No active sandboxes found.</p>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {sandboxes.map((sandbox) => (
                      <div key={sandbox.Id} className="p-4 border rounded-lg">
                        <h3 className="font-medium">{sandbox.SandboxName}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{sandbox.LicenseType}</p>
                        {sandbox.Description && (
                          <p className="text-sm text-muted-foreground mt-2">{sandbox.Description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};