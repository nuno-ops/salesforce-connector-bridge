import React, { useState } from 'react';
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { LicenseCardContent } from './license-card/LicenseCardContent';
import { LicenseInfo } from './types';

interface LicenseCardProps {
  title: string;
  licenses: LicenseInfo[];
  type: 'user' | 'package' | 'permissionSet';
}

export const LicenseCard = ({ title, licenses, type }: LicenseCardProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  console.log(`LicenseCard [${title}] received:`, {
    licensesCount: licenses?.length,
    firstLicense: licenses?.[0],
    type
  });

  const filteredLicenses = licenses.filter(license => {
    return license.name?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <LicenseCardContent 
        licenses={filteredLicenses}
        searchTerm={searchTerm}
        type={type}
      />
    </Card>
  );
};