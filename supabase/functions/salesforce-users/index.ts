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

    // Query 2: Get users - using same query structure as platform-licenses
    const usersQuery = `
      SELECT Id, Name, ProfileId, UserType, IsActive, Profile.Name, Email, LastLoginDate, Username
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
        const error = await response.text();
        console.error('API call failed:', error);
        throw new Error(`Salesforce API call failed: ${response.status} ${error}`);
      }

      return response.json();
    };

    // Fetch all data in parallel
    const [objectPermsData, userData, permSetData, oauthData] = await Promise.all([
      fetchSalesforceData(objectPermissionsQuery),
      fetchSalesforceData(usersQuery),
      fetchSalesforceData(permSetAssignmentsQuery),
      fetchSalesforceData('SELECT Id, AppName, LastUsedDate, UseCount, UserId FROM OauthToken')
    ]);

    // Create sets of ProfileIds and ParentIds that have access
    const profilesWithAccess = new Set(
      objectPermsData.records
        .filter(perm => perm.Parent?.ProfileId)
        .map(perm => perm.Parent.ProfileId)
    );

    const permSetsWithAccess = new Set(
      objectPermsData.records
        .filter(perm => perm.ParentId && !perm.Parent?.ProfileId)
        .map(perm => perm.ParentId)
    );

    // Process users with platform eligibility using the same logic as platform-licenses
    const usersWithEligibility = userData.records.map(user => {
      let isPlatformEligible = false;

      // Only check eligibility if user has a ProfileId
      if (user.ProfileId) {
        // Check if user's profile doesn't have access
        if (!profilesWithAccess.has(user.ProfileId)) {
          // Get user's permission sets
          const userPermSets = permSetData.records
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