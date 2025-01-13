import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Platform license calculation started');
    const { access_token, instance_url } = await req.json();

    if (!access_token || !instance_url) {
      console.error('Missing credentials:', { access_token: !!access_token, instance_url: !!instance_url });
      throw new Error('Missing access_token or instance_url');
    }

    // Helper function to make Salesforce API calls with session expiration handling
    const fetchSalesforceData = async (query: string, errorContext: string) => {
      const response = await fetch(
        `${instance_url}/services/data/v59.0/query?q=${encodeURIComponent(query)}`,
        { headers: { 'Authorization': `Bearer ${access_token}` } }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`${errorContext} query failed:`, errorText);
        
        try {
          const errorJson = JSON.parse(errorText);
          if (Array.isArray(errorJson) && errorJson[0]?.errorCode === 'INVALID_SESSION_ID') {
            return { sessionExpired: true };
          }
        } catch (e) {
          if (errorText.includes('INVALID_SESSION_ID') || errorText.includes('Session expired')) {
            return { sessionExpired: true };
          }
        }
        
        throw new Error(`Failed to fetch ${errorContext}: ${errorText}`);
      }

      return response.json();
    };

    console.log('Fetching object permissions...');
    const objectPermissionsQuery = `
      SELECT Parent.Profile.Name, Parent.ProfileId, Parent.Label, ParentId, 
             SObjectType, PermissionsCreate, PermissionsRead, PermissionsEdit, 
             PermissionsDelete, PermissionsModifyAllRecords, PermissionsViewAllRecords 
      FROM ObjectPermissions 
      WHERE SObjectType IN ('Opportunity', 'Lead', 'Case')
    `;

    const usersQuery = `
      SELECT Id, Name, ProfileId, UserType, IsActive, Profile.Name, Email, LastLoginDate
      FROM User
      WHERE IsActive = true
    `;

    const permSetAssignmentsQuery = `
      SELECT Id, AssigneeId, PermissionSetId, PermissionSet.Label
      FROM PermissionSetAssignment
    `;

    // Fetch all data in parallel
    const [objectPerms, users, permSetAssignments] = await Promise.all([
      fetchSalesforceData(objectPermissionsQuery, 'Object permissions'),
      fetchSalesforceData(usersQuery, 'Users'),
      fetchSalesforceData(permSetAssignmentsQuery, 'Permission set assignments')
    ]);

    // Check if any response indicates session expiration
    if (objectPerms?.sessionExpired || users?.sessionExpired || permSetAssignments?.sessionExpired) {
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
      objectPerms.records
        .filter(perm => perm.Parent?.ProfileId)
        .map(perm => perm.Parent.ProfileId)
    );

    const permSetsWithAccess = new Set(
      objectPerms.records
        .filter(perm => perm.ParentId && !perm.Parent?.ProfileId)
        .map(perm => perm.ParentId)
    );

    // Find users eligible for platform licenses
    const eligibleUsers = users.records.filter(user => {
      if (!user.ProfileId) {
        console.log(`User ${user.Name} (${user.Id}) has no ProfileId, skipping`);
        return false;
      }

      if (profilesWithAccess.has(user.ProfileId)) {
        return false;
      }

      const userPermSets = permSetAssignments.records
        .filter(psa => psa.AssigneeId === user.Id)
        .map(psa => psa.PermissionSetId);

      return !userPermSets.some(psId => permSetsWithAccess.has(psId));
    });

    console.log('Users eligible for platform licenses:', eligibleUsers.length);

    return new Response(
      JSON.stringify({
        eligibleUsers,
        totalEligible: eligibleUsers.length,
        debug: {
          totalProfiles: profilesWithAccess.size,
          totalPermSets: permSetsWithAccess.size,
          totalUsers: users.records.length,
          totalAssignments: permSetAssignments.records.length
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in platform license calculation:', error);
    
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
      JSON.stringify({ 
        error: error.message,
        totalEligible: 0,
        eligibleUsers: []
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});