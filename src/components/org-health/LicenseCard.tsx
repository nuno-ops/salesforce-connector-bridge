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

  // New detailed logging of raw license data
  console.log(`LicenseCard [${title}] raw license data:`, {
    firstLicense: licenses[0],
    allProperties: Object.keys(licenses[0] || {}),
    licenseType: type,
    allLicenses: licenses
  });

  // Log before filtering
  console.log('Before filtering:', {
    license: licenses[0],
    hasNameProperty: licenses[0]?.name,
    rawLicenseData: licenses[0],
    allProperties: licenses[0] ? Object.getOwnPropertyNames(licenses[0]) : []
  });

  const filteredLicenses = licenses.filter(license => {
    // Enhanced logging for filter check
    console.log('Filter check:', {
      license,
      nameProperty: license?.name,
      allProperties: Object.keys(license),
      searchTermCheck: searchTerm,
      wouldPass: license?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    });

    return license.name?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Log after filtering
  console.log(`LicenseCard [${title}] filtered licenses:`, {
    original: licenses.length,
    filtered: filteredLicenses.length,
    searchTerm,
    firstFilteredLicense: filteredLicenses[0],
    allFilteredProperties: filteredLicenses[0] ? Object.keys(filteredLicenses[0]) : []
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