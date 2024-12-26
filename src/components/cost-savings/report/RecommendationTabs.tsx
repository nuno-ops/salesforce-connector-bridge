import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { LicenseRecommendation } from "../LicenseRecommendation";
import { LicenseData } from "../utils/licenseTypes";

interface RecommendationTabsProps {
  categorizedLicenses: Record<string, LicenseData[]>;
  getLicenseRecommendations: (licenses: LicenseData[]) => Array<{
    license: LicenseData;
    priority: 'high' | 'medium';
  }>;
}

export const RecommendationTabs = ({
  categorizedLicenses,
  getLicenseRecommendations
}: RecommendationTabsProps) => {
  const defaultCategory = Object.keys(categorizedLicenses)[0]?.toLowerCase().replace(/\s+/g, '-') || 'other-licenses';

  return (
    <Tabs defaultValue={defaultCategory} className="w-full">
      <TabsList className="w-full grid grid-cols-3 lg:grid-cols-5 h-auto gap-2 bg-muted/50 p-1">
        {Object.keys(categorizedLicenses).map(category => (
          <TabsTrigger 
            key={category} 
            value={category.toLowerCase().replace(/\s+/g, '-')}
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
          >
            {category}
          </TabsTrigger>
        ))}
      </TabsList>

      {Object.entries(categorizedLicenses).map(([category, licenses]) => {
        const recommendations = getLicenseRecommendations(licenses);
        return (
          <TabsContent 
            key={category} 
            value={category.toLowerCase().replace(/\s+/g, '-')}
            className="space-y-4 mt-4"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {recommendations.length > 0 ? (
                recommendations.map((rec, index) => (
                  <motion.div
                    key={`${category}-license-${index}`}
                    initial={{ x: -20 }}
                    animate={{ x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <LicenseRecommendation
                      license={rec.license}
                      priority={rec.priority}
                    />
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">
                    No optimization opportunities found for {category} licenses.
                  </p>
                </div>
              )}
            </motion.div>
          </TabsContent>
        );
      })}
    </Tabs>
  );
};