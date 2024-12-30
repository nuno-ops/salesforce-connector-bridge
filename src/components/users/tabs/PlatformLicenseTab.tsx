import { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { usePlatformUsers } from '../hooks/usePlatformUsers';

interface PlatformLicenseTabProps {
  instanceUrl: string;
  maskUsername: (username: string) => string;
}

export const PlatformLicenseTab = ({ instanceUrl, maskUsername }: PlatformLicenseTabProps) => {
  const { users, isLoading, error } = usePlatformUsers();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mt-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Failed to load platform license users</AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <Alert className="mt-4 mb-4">
        <AlertCircle className="h-4 w-4" />
        <div className="ml-2">
          <div className="font-medium">Platform License Usage Guide</div>
          <AlertDescription className="mt-1 text-sm">
            <p className="mb-2">Platform licenses are ideal for users who:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Only need access to custom objects and apps</li>
              <li>Don't require access to standard CRM features</li>
              <li>Primarily use custom built applications</li>
              <li>Need basic Salesforce platform functionality</li>
            </ul>
          </AlertDescription>
        </div>
      </Alert>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead>User Type</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.Id}>
                <TableCell>{maskUsername(user.Username)}</TableCell>
                <TableCell>
                  {user.LastLoginDate 
                    ? format(new Date(user.LastLoginDate), 'PPp')
                    : 'Never'}
                </TableCell>
                <TableCell>{user.UserType}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(`${instanceUrl}/${user.Id}`, '_blank')}
                  >
                    View User <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
};