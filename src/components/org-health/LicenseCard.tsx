import React, { useState } from 'react';
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { LicenseCardContent } from './license-card/LicenseCardContent';
import { LicenseInfo, RawUserLicense, RawPackageLicense, RawPermissionSetLicense } from './types';

interface LicenseCardProps {
  title: string;
  licenses: (RawUserLicense | RawPackageLicense | RawPermissionSetLicense)[];
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
  const transformedLicenses: LicenseInfo[] = licenses.map(license => {
    if (type === 'permissionSet') {
      const psl = license as RawPermissionSetLicense;
      return {
        name: psl.DeveloperName,
        total: psl.TotalLicenses,
        used: psl.UsedLicenses,
        id: psl.Id,
        type: 'permissionSet'
      };
    } else if (type === 'package') {
      const pl = license as RawPackageLicense;
      return {
        name: pl.NamespacePrefix,
        total: pl.AllowedLicenses,
        used: pl.UsedLicenses,
        id: pl.Id,
        status: pl.Status,
        type: 'package'
      };
    } else {
      const ul = license as RawUserLicense;
      return {
        name: ul.Name,
        total: ul.TotalLicenses,
        used: ul.UsedLicenses,
        id: ul.Id,
        type: 'user'
      };
    }
  });

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