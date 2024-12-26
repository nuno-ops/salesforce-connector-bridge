export interface LicenseCategory {
  name: string;
  description: string;
  identifiers: string[];
}

export const LICENSE_CATEGORIES: LicenseCategory[] = [
  {
    name: 'Core Licenses',
    description: 'Primary Salesforce licenses',
    identifiers: ['sales cloud', 'service cloud', 'platform', 'lightning']
  },
  {
    name: 'Einstein & Analytics',
    description: 'AI and analytics capabilities',
    identifiers: ['einstein', 'analytics', 'tableau', 'prediction']
  },
  {
    name: 'Industry Solutions',
    description: 'Industry-specific licenses',
    identifiers: ['health cloud', 'financial services', 'manufacturing', 'education', 'revenue cloud']
  },
  {
    name: 'Platform Extensions',
    description: 'Platform add-ons and capabilities',
    identifiers: ['shield', 'private connect', 'encryption', 'event monitoring', 'identity']
  },
  {
    name: 'Integration & Development',
    description: 'Development and integration tools',
    identifiers: ['mulesoft', 'heroku', 'sandbox', 'integration', 'api', 'composer']
  },
  {
    name: 'Communities & Portals',
    description: 'External user licenses',
    identifiers: ['community', 'portal', 'partner', 'customer', 'external']
  }
];

export interface LicenseData {
  name: string;
  total: number;
  used: number;
  category?: string;
  status?: string;
}

export const categorizeLicense = (licenseName: string): string => {
  const lowerName = licenseName.toLowerCase();
  
  for (const category of LICENSE_CATEGORIES) {
    if (category.identifiers.some(identifier => lowerName.includes(identifier))) {
      return category.name;
    }
  }
  
  return 'Other Licenses';
};

export const groupLicensesByCategory = (licenses: LicenseData[]): Record<string, LicenseData[]> => {
  const grouped: Record<string, LicenseData[]> = {};
  
  licenses.forEach(license => {
    const category = categorizeLicense(license.name);
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push({ ...license, category });
  });
  
  return grouped;
};