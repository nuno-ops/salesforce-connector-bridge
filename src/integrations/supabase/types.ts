// Base types for all tables
type BaseRow = {
  id: string;
  created_at?: string | null;
  updated_at?: string | null;
};

// Consultation Bookings
type ConsultationBooking = BaseRow & {
  org_id: string;
  stripe_session_id?: string | null;
  status: string;
  is_free?: boolean | null;
};

// Organization Settings
type OrganizationSetting = BaseRow & {
  org_id: string;
  org_type: string;
  license_cost_per_user: number;
};

// Organization Subscriptions
type OrganizationSubscription = BaseRow & {
  org_id: string;
  stripe_subscription_id?: string | null;
  stripe_customer_id?: string | null;
  status: string;
  current_period_start?: string | null;
  current_period_end?: string | null;
};

// Salesforce Contracts
type SalesforceContract = BaseRow & {
  org_id: string;
  file_name: string;
  file_path: string;
  extracted_value?: number | null;
  extracted_services?: Json | null;
};

// JSON type definition
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Database type definition
export type Database = {
  public: {
    Tables: {
      consultation_bookings: {
        Row: ConsultationBooking;
        Insert: Omit<ConsultationBooking, 'id'> & { id?: string };
        Update: Partial<ConsultationBooking>;
        Relationships: [];
      };
      organization_settings: {
        Row: OrganizationSetting;
        Insert: Omit<OrganizationSetting, 'id'> & { id?: string };
        Update: Partial<OrganizationSetting>;
        Relationships: [];
      };
      organization_subscriptions: {
        Row: OrganizationSubscription;
        Insert: Omit<OrganizationSubscription, 'id'> & { id?: string };
        Update: Partial<OrganizationSubscription>;
        Relationships: [];
      };
      salesforce_contracts: {
        Row: SalesforceContract;
        Insert: Omit<SalesforceContract, 'id'> & { id?: string };
        Update: Partial<SalesforceContract>;
        Relationships: [];
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
};

// Helper types for better type inference
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];