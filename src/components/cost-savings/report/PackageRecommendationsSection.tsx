import { motion } from "framer-motion";
import { PackageRecommendation } from "../PackageRecommendation";

interface PackageRecommendationsSectionProps {
  packageRecommendations: Array<{
    package: {
      name: string;
      total: number;
      used: number;
      status: string;
    };
    priority: 'high' | 'medium';
  }>;
}

export const PackageRecommendationsSection = ({
  packageRecommendations
}: PackageRecommendationsSectionProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="space-y-4"
    >
      {packageRecommendations.map((rec, index) => (
        <PackageRecommendation
          key={`package-${index}`}
          package={rec.package}
          priority={rec.priority}
        />
      ))}
    </motion.div>
  );
};