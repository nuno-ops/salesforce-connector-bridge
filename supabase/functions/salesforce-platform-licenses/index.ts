import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { access_token, instance_url } = await req.json();

    if (!access_token || !instance_url) {
      throw new Error('Missing access_token or instance_url');
    }

    // Query 1: Get object permissions for Opportunity, Lead, and Case
    const objectPermissionsQuery = `
      SELECT Parent.Profile.Name, Parent.ProfileId, Parent.Label, ParentId, 
             SObjectType, PermissionsCreate, PermissionsRead, PermissionsEdit, 
             PermissionsDelete, PermissionsModifyAllRecords, PermissionsViewAllRecords 
      FROM ObjectPermissions 
      WHERE SObjectType IN ('Opportunity', 'Lead', 'Case')
    `;

    // Query 2: Get users and their profiles
    const usersQuery = `
      SELECT Id, Name, ProfileId, UserType, IsActive
      FROM User
      WHERE IsActive = true
      AND UserType = 'Standard'
    `;

    // Query 3: Get permission set assignments
    const permSetAssignmentsQuery = `
      SELECT Id, AssigneeId, PermissionSetId, PermissionSet.Label
      FROM PermissionSetAssignment
    `;

    // Execute all queries in parallel
    const [objectPermsResponse, usersResponse, permSetResponse] = await Promise.all([
      fetch(`${instance_url}/services/data/v59.0/query?q=${encodeURIComponent(objectPermissionsQuery)}`, {
        headers: { 'Authorization': `Bearer ${access_token}` }
      }),
      fetch(`${instance_url}/services/data/v59.0/query?q=${encodeURIComponent(usersQuery)}`, {
        headers: { 'Authorization': `Bearer ${access_token}` }
      }),
      fetch(`${instance_url}/services/data/v59.0/query?q=${encodeURIComponent(permSetAssignmentsQuery)}`, {
        headers: { 'Authorization': `Bearer ${access_token}` }
      })
    ]);

    if (!objectPermsResponse.ok || !usersResponse.ok || !permSetResponse.ok) {
      throw new Error('Failed to fetch data from Salesforce');
    }

    const [objectPerms, users, permSetAssignments] = await Promise.all([
      objectPermsResponse.json(),
      usersResponse.json(),
      permSetResponse.json()
    ]);

    // Create sets of ProfileIds and ParentIds that have access to these objects
    const profilesWithAccess = new Set(
      objectPerms.records
        .filter(perm => perm.Parent.ProfileId)
        .map(perm => perm.Parent.ProfileId)
    );

    const permSetsWithAccess = new Set(
      objectPerms.records
        .filter(perm => perm.ParentId && !perm.Parent.ProfileId)
        .map(perm => perm.ParentId)
    );

    // Find users who don't have access through either profiles or permission sets
    const usersForPlatformLicense = users.records.filter(user => {
      // Check if user's profile doesn't have access
      if (profilesWithAccess.has(user.ProfileId)) {
        return false;
      }

      // Check if user has any permission set that grants access
      const userPermSets = permSetAssignments.records
        .filter(psa => psa.AssigneeId === user.Id)
        .map(psa => psa.PermissionSetId);

      return !userPermSets.some(psId => permSetsWithAccess.has(psId));
    });

    console.log(`Found ${usersForPlatformLicense.length} users eligible for platform licenses`);

    return new Response(
      JSON.stringify({
        eligibleUsers: usersForPlatformLicense,
        totalEligible: usersForPlatformLicense.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});