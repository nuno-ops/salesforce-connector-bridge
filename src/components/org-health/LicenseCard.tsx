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
    licensesLength: licenses.length,
    firstLicense: licenses[0],
    allLicenseProperties: licenses[0] ? Object.keys(licenses[0]) : [],
    type,
    searchTerm
  });

  console.log('Before filtering:', {
    licenses,
    firstLicenseComplete: licenses[0],
    nameProperty: licenses[0]?.name,
    type,
    searchTerm
  });

  const filteredLicenses = licenses.filter(license => {
    console.log('Filtering license:', {
      licenseName: license.name,
      completeObject: license,
      wouldPass: license.name?.toLowerCase().includes(searchTerm.toLowerCase())
    });

    return license.name?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  console.log(`LicenseCard [${title}] filtered results:`, {
    original: licenses.length,
    filtered: filteredLicenses.length,
    searchTerm,
    firstFiltered: filteredLicenses[0],
    sampleFiltered: filteredLicenses.slice(0, 2)
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