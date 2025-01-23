import { CreditCard, FileText } from "lucide-react";

export const savingsMonitorData = {
  title: "Savings Monitor",
  description: "Perfect for businesses seeking ongoing insights and continuous savings opportunities. Monitor your Salesforce organization and uncover new ways to save every month.",
  icon: CreditCard,
  price: "$39",
  period: "/month",
  benefits: [
    {
      text: "Unlimited Access",
      description: "View your savings dashboard and reports anytime throughout the subscription period."
    },
    {
      text: "Ongoing Updates",
      description: "Stay updated with the latest cost-saving insights as your Salesforce organization evolves."
    },
    {
      text: "Continuous Savings Opportunities",
      description: "Get alerts for new opportunities to optimize licenses, storage, or contracts (coming soon)."
    },
    {
      text: "Flexible Cancellation",
      description: "Cancel anytime after the first month if you no longer need the service."
    },
    {
      text: "Free Consultation",
      description: "Includes a complimentary consultation call."
    }
  ],
  buttonText: "Subscribe Monthly",
  priceId: "price_1QcpLNBqwIrd79CSxQ5cNF4M"
};

export const savingsSnapshotData = {
  title: "Savings Snapshot",
  description: "Best for businesses that want immediate results without a long-term commitment. Get a full, detailed analysis of your savings potential with no strings attached.",
  icon: FileText,
  price: "$99",
  period: "one-time",
  benefits: [
    {
      text: "One-Time Investment",
      description: "Pay once and get a detailed, actionable report on your Salesforce savings."
    },
    {
      text: "Immediate ROI",
      description: "Gain instant clarity on where you can save, without committing to a subscription."
    },
    {
      text: "Downloadable Report",
      description: "Access and share the comprehensive savings analysis with your team."
    },
    {
      text: "Perfect for Quick Wins",
      description: "Ideal for organizations needing immediate insights without ongoing monitoring."
    }
  ],
  buttonText: "Purchase Report",
  priceId: "price_1QcpL9BqwIrd79CS00DpeBgL"
};