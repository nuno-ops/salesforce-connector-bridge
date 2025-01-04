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

  console.log(`LicenseCard [${title}] render with:`, {
    licensesLength: licenses.length,
    firstLicense: licenses[0],
    type
  });

  // Log before filtering
  console.log('Before filtering:', {
    license: licenses[0],
    hasNameProperty: licenses[0]?.name,
    rawLicenseData: licenses[0]
  });

  const filteredLicenses = licenses.filter(license => {
    // Log filter check for each license
    console.log('Filter check:', {
      license,
      nameCheck: license?.name,
      searchTermCheck: searchTerm,
      wouldPass: license?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    });

    return license.name?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Log after filtering
  console.log(`LicenseCard [${title}] filtered licenses:`, {
    original: licenses.length,
    filtered: filteredLicenses.length,
    searchTerm
  });

  console.log('After filtering:', {
    filteredCount: filteredLicenses.length,
    firstFilteredLicense: filteredLicenses[0],
    filterCriteria: searchTerm
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