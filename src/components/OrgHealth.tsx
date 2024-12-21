import { LicensesSection } from './org-health/LicensesSection';
import { LimitsSection } from './org-health/LimitsSection';
import { MetricsSection } from './org-health/MetricsSection';
import { SandboxList } from './org-health/SandboxList';
import { QuotePdfDownloader } from './salesforce/QuotePdfDownloader';

export const OrgHealth = () => {
  return (
    <div className="space-y-8">
      {/* Test Quote PDF Download */}
      <div className="p-4 bg-white rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Quote PDF Download (Test)</h2>
        <QuotePdfDownloader quoteId="0xfed000001fVNRAA2" />
      </div>

      <LicensesSection />
      <LimitsSection />
      <MetricsSection />
      <SandboxList />
    </div>
  );
};