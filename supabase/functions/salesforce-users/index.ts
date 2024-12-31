import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { access_token, instance_url } = await req.json();

    if (!access_token || !instance_url) {
      throw new Error('Missing required parameters');
    }

    // Ensure instance_url doesn't have a trailing slash or colon
    const baseUrl = instance_url.replace(/[:\/]$/, '');

    // User query with proper fields
    const userQuery = `
      SELECT Id, Username, LastLoginDate, UserType, Profile.Name, Profile.Id, Profile.UserLicense.LicenseDefinitionKey
      FROM User 
      WHERE IsActive = true 
      LIMIT 1000
    `;

    // Query for object permissions - matching salesforce-platform-licenses logic
    const objectPermissionsQuery = `
      SELECT Parent.Profile.Name, Parent.ProfileId, Parent.Label, ParentId, 
             SObjectType, PermissionsCreate, PermissionsRead, PermissionsEdit, 
             PermissionsDelete, PermissionsModifyAllRecords, PermissionsViewAllRecords 
      FROM ObjectPermissions 
      WHERE SObjectType IN ('Opportunity', 'Lead', 'Case')
    `;

    console.log('Fetching Salesforce data...');

    // Helper function to make Salesforce API calls
    const fetchSalesforceData = async (query: string) => {
      const url = `${baseUrl}/services/data/v57.0/query?q=${encodeURIComponent(query)}`;
      console.log('Fetching from URL:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('API call failed:', error);
        throw new Error(`Salesforce API call failed: ${response.status} ${error}`);
      }

      return response.json();
    };

    // Fetch data in parallel
    const [userData, oauthData, objectPermsData] = await Promise.all([
      fetchSalesforceData(userQuery),
      fetchSalesforceData('SELECT Id, AppName, LastUsedDate, UseCount, UserId FROM OauthToken'),
      fetchSalesforceData(objectPermissionsQuery),
    ]);

    if (!userData.records || !oauthData.records || !objectPermsData.records) {
      throw new Error('Invalid response format from Salesforce');
    }

    console.log('Data fetched successfully');
    console.log('Users count:', userData.records.length);
    console.log('OAuth tokens count:', oauthData.records.length);
    console.log('Object permissions count:', objectPermsData.records.length);

    // Create sets of ProfileIds and ParentIds that have access, with null checks
    const profilesWithAccess = new Set(
      objectPermsData.records
        .filter(perm => perm.Parent && perm.Parent.ProfileId)
        .map(perm => perm.Parent.ProfileId)
    );

    // Process users with eligibility using the same logic as salesforce-platform-licenses
    const usersWithEligibility = userData.records.map(user => {
      // Skip users without ProfileId or specific types we want to exclude
      if (!user.Profile?.Id || 
          user.UserType === 'CsnOnly' || 
          user.UserType === 'Standard') {
        return {
          ...user,
          isPlatformEligible: false
        };
      }

      // Check if user's profile has access to standard objects
      const isPlatformEligible = !profilesWithAccess.has(user.Profile.Id);

      return {
        ...user,
        isPlatformEligible
      };
    });

    const eligibleUsers = usersWithEligibility.filter(u => u.isPlatformEligible);
    console.log('Platform eligible users:', eligibleUsers.length);
    console.log('Eligible users:', eligibleUsers.map(u => ({
      id: u.Id,
      name: u.Username,
      type: u.UserType,
      profile: u.Profile?.Name
    })));
    
    return new Response(
      JSON.stringify({
        users: usersWithEligibility,
        oauthTokens: oauthData.records
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('Error in salesforce-users function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});