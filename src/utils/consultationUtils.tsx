import { supabase } from "@/integrations/supabase/client";
import { Toast } from "@/hooks/use-toast";

export const CALENDLY_URL = 'https://calendly.com/salesforcesaver-support/30min';

export const showCalendlyToast = (toast: Toast, url: string, isFree: boolean = false) => {
  setTimeout(() => {
    toast({
      title: "🎉 Schedule Your Consultation",
      description: (
        <div className="space-y-4">
          <p className="text-lg font-medium">
            {isFree ? "You're eligible for a free consultation!" : "Thank you for your payment!"}
          </p>
          <p>Click below to schedule your consultation:</p>
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-block px-4 py-2 bg-sf-blue text-white rounded-md hover:bg-sf-hover transition-colors"
          >
            Open Calendly Scheduling
          </a>
        </div>
      ),
    });
  }, 3000);
};

export const createConsultationBooking = async (
  toast: Toast,
  orgId: string, 
  isFree: boolean = false, 
  stripeSessionId?: string
) => {
  // Delay the creation of the consultation booking by 1 minute
  setTimeout(async () => {
    const { error } = await supabase
      .from('consultation_bookings')
      .insert({
        org_id: orgId,
        is_free: isFree,
        stripe_session_id: stripeSessionId,
        status: 'confirmed'
      });

    if (error) {
      console.error('Error creating consultation booking:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to record your consultation booking. Please contact support."
      });
    }
  }, 60000); // 60000ms = 1 minute
};

export const checkConsultationEligibility = async (orgId: string) => {
  // Check subscription status
  const { data: subscription } = await supabase
    .from('organization_subscriptions')
    .select('*')
    .eq('org_id', orgId)
    .eq('status', 'active')
    .maybeSingle();

  // Check if they've used their free consultation this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data: consultations } = await supabase
    .from('consultation_bookings')
    .select('*')
    .eq('org_id', orgId)
    .gte('created_at', startOfMonth.toISOString())
    .order('created_at', { ascending: false });

  const hasUsedFreeConsultation = consultations && consultations.length > 0;
  const isSubscriber = subscription !== null;

  return {
    isSubscriber,
    hasUsedFreeConsultation,
  };
};