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

  console.log(`LicenseCard [${title}] raw input:`, {
    licenses,
    type,
    isArray: Array.isArray(licenses),
    licensesLength: licenses?.length,
    firstLicense: licenses?.[0],
    allLicenses: licenses
  });

  // Transform the raw license data into the expected format
  const transformedLicenses = licenses.map(license => ({
    name: type === 'permissionSet' ? license.DeveloperName : 
          type === 'package' ? license.NamespacePrefix : 
          license.Name,
    total: type === 'package' ? license.AllowedLicenses : license.TotalLicenses,
    used: license.UsedLicenses,
    id: license.Id,
    status: type === 'package' ? license.Status : undefined,
    type
  }));

  const filteredLicenses = transformedLicenses.filter(license => {
    const searchString = license.name?.toLowerCase() || '';
    return searchString.includes(searchTerm.toLowerCase());
  });

  console.log(`LicenseCard [${title}] filtered licenses:`, {
    filteredLicenses,
    filteredLength: filteredLicenses.length,
    searchTerm
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