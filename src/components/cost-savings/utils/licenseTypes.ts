export interface LicenseCategory {
  name: string;
  description: string;
  identifiers: string[];
  recommendations: {
    underutilized: string[];
    costOptimization: string[];
    bestPractices: string[];
  };
}

export const LICENSE_CATEGORIES: LicenseCategory[] = [
  {
    name: 'Core Licenses',
    description: 'Primary Salesforce licenses',
    identifiers: ['sales cloud', 'service cloud', 'platform', 'lightning'],
    recommendations: {
      underutilized: [
        'Consider downgrading inactive Sales Cloud users to Platform licenses',
        'Review Service Cloud licenses for seasonal staff',
        'Analyze login patterns to identify sharing opportunities'
      ],
      costOptimization: [
        'Implement license pooling for shift workers',
        'Use Platform licenses for custom app users',
        'Consider Chatter-only licenses for collaboration users'
      ],
      bestPractices: [
        'Implement regular license usage audits',
        'Set up automated deactivation workflows',
        'Document license assignment criteria'
      ]
    }
  },
  {
    name: 'Einstein & Analytics',
    description: 'AI and analytics capabilities',
    identifiers: ['einstein', 'analytics', 'tableau', 'prediction'],
    recommendations: {
      underutilized: [
        'Review Einstein Activity Capture adoption',
        'Analyze Tableau CRM dashboard usage',
        'Monitor AI prediction utilization'
      ],
      costOptimization: [
        'Consolidate Einstein Analytics licenses',
        'Share Tableau dashboards instead of individual licenses',
        'Optimize Einstein Prediction allocation'
      ],
      bestPractices: [
        'Set up Einstein adoption tracking',
        'Create analytics usage reports',
        'Implement predictive model monitoring'
      ]
    }
  },
  {
    name: 'Industry Solutions',
    description: 'Industry-specific licenses',
    identifiers: ['health cloud', 'financial services', 'manufacturing', 'education', 'revenue cloud'],
    recommendations: {
      underutilized: [
        'Review Health Cloud patient coordinator licenses',
        'Analyze Financial Services Cloud advisor usage',
        'Monitor Manufacturing Cloud forecasting adoption'
      ],
      costOptimization: [
        'Optimize patient/client portal licenses',
        'Review relationship group usage',
        'Analyze industry-specific feature adoption'
      ],
      bestPractices: [
        'Implement role-based license assignment',
        'Set up industry compliance monitoring',
        'Create specialized usage dashboards'
      ]
    }
  },
  {
    name: 'Platform Extensions',
    description: 'Platform add-ons and capabilities',
    identifiers: ['shield', 'private connect', 'encryption', 'event monitoring', 'identity'],
    recommendations: {
      underutilized: [
        'Review Shield Event Monitoring usage',
        'Analyze Platform Encryption implementation',
        'Monitor Identity verification patterns'
      ],
      costOptimization: [
        'Optimize Shield license distribution',
        'Review Private Connect usage patterns',
        'Analyze Identity license requirements'
      ],
      bestPractices: [
        'Implement security monitoring',
        'Set up encryption key rotation',
        'Document compliance requirements'
      ]
    }
  },
  {
    name: 'Integration & Development',
    description: 'Development and integration tools',
    identifiers: ['mulesoft', 'heroku', 'sandbox', 'integration', 'api', 'composer'],
    recommendations: {
      underutilized: [
        'Review API call volume patterns',
        'Analyze Heroku dyno usage',
        'Monitor sandbox refresh patterns'
      ],
      costOptimization: [
        'Optimize API call distribution',
        'Review Heroku resource allocation',
        'Analyze sandbox types and usage'
      ],
      bestPractices: [
        'Implement API monitoring',
        'Set up resource scaling policies',
        'Create sandbox management strategy'
      ]
    }
  },
  {
    name: 'Communities & Portals',
    description: 'External user licenses',
    identifiers: ['community', 'portal', 'partner', 'customer', 'external'],
    recommendations: {
      underutilized: [
        'Review community member login patterns',
        'Analyze portal usage statistics',
        'Monitor partner engagement levels'
      ],
      costOptimization: [
        'Optimize community license types',
        'Review login-based vs member-based licensing',
        'Analyze portal user activity'
      ],
      bestPractices: [
        'Implement community adoption tracking',
        'Set up usage monitoring',
        'Create engagement reports'
      ]
    }
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

export const getCategoryRecommendations = (categoryName: string): LicenseCategory['recommendations'] | null => {
  const category = LICENSE_CATEGORIES.find(cat => cat.name === categoryName);
  return category?.recommendations || null;
};