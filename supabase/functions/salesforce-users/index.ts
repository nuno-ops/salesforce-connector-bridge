import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { access_token, instance_url } = await req.json();

    if (!access_token || !instance_url) {
      throw new Error('Missing access_token or instance_url');
    }

    // Sanitize instance URL
    const baseUrl = instance_url.replace(/\/+$/, '').replace(/:\/*$/, '');

    console.log('Fetching Salesforce data...');

    // Query 1: Get object permissions - using exact same query as platform-licenses
    const objectPermissionsQuery = `
      SELECT Parent.Profile.Name, Parent.ProfileId, Parent.Label, ParentId, 
             SObjectType, PermissionsCreate, PermissionsRead, PermissionsEdit, 
             PermissionsDelete, PermissionsModifyAllRecords, PermissionsViewAllRecords 
      FROM ObjectPermissions 
      WHERE SObjectType IN ('Opportunity', 'Lead', 'Case')
    `;

    // Updated query to include Profile.UserLicense.Name
    const usersQuery = `
      SELECT Id, Name, ProfileId, UserType, IsActive, Profile.Name, Profile.UserLicense.Name, 
             Email, LastLoginDate, Username
      FROM User
      WHERE IsActive = true
    `;

    // Query 3: Get permission set assignments - using same query as platform-licenses
    const permSetAssignmentsQuery = `
      SELECT Id, AssigneeId, PermissionSetId, PermissionSet.Label
      FROM PermissionSetAssignment
    `;

    // Helper function to make Salesforce API calls
    const fetchSalesforceData = async (query: string) => {
      const response = await fetch(
        `${baseUrl}/services/data/v57.0/query?q=${encodeURIComponent(query)}`,
        {
          headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API call failed:', errorText);
        
        try {
          const errorJson = JSON.parse(errorText);
          if (Array.isArray(errorJson) && errorJson[0]?.errorCode === 'INVALID_SESSION_ID') {
            return { sessionExpired: true };
          }
        } catch (e) {
          // If JSON parsing fails, check the raw text
          if (errorText.includes('INVALID_SESSION_ID') || errorText.includes('Session expired')) {
            return { sessionExpired: true };
          }
        }
        
        throw new Error(`Salesforce API call failed: ${errorText}`);
      }

      return response.json();
    };

    // Fetch all data in parallel
    const [objectPermsResponse, userDataResponse, permSetResponse, oauthResponse] = await Promise.all([
      fetchSalesforceData(objectPermissionsQuery),
      fetchSalesforceData(usersQuery),
      fetchSalesforceData(permSetAssignmentsQuery),
      fetchSalesforceData('SELECT Id, AppName, LastUsedDate, UseCount, UserId FROM OauthToken WHERE UseCount > 0')
    ]);

    // Check if any response indicates session expiration
    if (objectPermsResponse?.sessionExpired || 
        userDataResponse?.sessionExpired || 
        permSetResponse?.sessionExpired || 
        oauthResponse?.sessionExpired) {
      console.log('Session expired, returning appropriate response');
      return new Response(
        JSON.stringify({ 
          error: 'Session expired or invalid',
          errorCode: 'INVALID_SESSION_ID'
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create sets of ProfileIds and ParentIds that have access
    const profilesWithAccess = new Set(
      objectPermsResponse.records
        .filter(perm => perm.Parent?.ProfileId)
        .map(perm => perm.Parent.ProfileId)
    );

    const permSetsWithAccess = new Set(
      objectPermsResponse.records
        .filter(perm => perm.ParentId && !perm.Parent?.ProfileId)
        .map(perm => perm.ParentId)
    );

    // Process users with platform eligibility using the same logic as platform-licenses
    const usersWithEligibility = userDataResponse.records.map(user => {
      let isPlatformEligible = false;

      // Only check eligibility if user has a ProfileId
      if (user.ProfileId) {
        // Check if user's profile doesn't have access
        if (!profilesWithAccess.has(user.ProfileId)) {
          // Get user's permission sets
          const userPermSets = permSetResponse.records
            .filter(psa => psa.AssigneeId === user.Id)
            .map(psa => psa.PermissionSetId);

          // User is eligible if they don't have any permission set that grants access
          isPlatformEligible = !userPermSets.some(psId => permSetsWithAccess.has(psId));
        }
      }

      return {
        ...user,
        isPlatformEligible
      };
    });

    return new Response(
      JSON.stringify({
        users: usersWithEligibility,
        oauthTokens: oauthResponse.records
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in salesforce-users function:', error);
    
    // Check if the error is related to session expiration
    if (error.message?.includes('INVALID_SESSION_ID') || error.message?.includes('Session expired')) {
      return new Response(
        JSON.stringify({ 
          error: 'Session expired or invalid',
          errorCode: 'INVALID_SESSION_ID'
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});