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

    console.log('Fetching object permissions...');
    // Query 1: Get object permissions
    const objectPermissionsQuery = `
      SELECT Parent.Profile.Name, Parent.ProfileId, Parent.Label, ParentId, 
             SObjectType, PermissionsCreate, PermissionsRead, PermissionsEdit, 
             PermissionsDelete, PermissionsModifyAllRecords, PermissionsViewAllRecords 
      FROM ObjectPermissions 
      WHERE SObjectType IN ('Opportunity', 'Lead', 'Case')
    `;

    const objectPermsResponse = await fetch(
      `${instance_url}/services/data/v59.0/query?q=${encodeURIComponent(objectPermissionsQuery)}`,
      { headers: { 'Authorization': `Bearer ${access_token}` } }
    );

    if (!objectPermsResponse.ok) {
      console.error('Object permissions query failed:', await objectPermsResponse.text());
      throw new Error('Failed to fetch object permissions');
    }

    const objectPerms = await objectPermsResponse.json();
    console.log('Object permissions found:', objectPerms.records.length);

    console.log('Fetching users...');
    // Query 2: Get users
    const usersQuery = `
      SELECT Id, Name, ProfileId, UserType, IsActive
      FROM User
      WHERE IsActive = true
      AND UserType = 'Standard'
    `;

    const usersResponse = await fetch(
      `${instance_url}/services/data/v59.0/query?q=${encodeURIComponent(usersQuery)}`,
      { headers: { 'Authorization': `Bearer ${access_token}` } }
    );

    if (!usersResponse.ok) {
      console.error('Users query failed:', await usersResponse.text());
      throw new Error('Failed to fetch users');
    }

    const users = await usersResponse.json();
    console.log('Active users found:', users.records.length);

    console.log('Fetching permission set assignments...');
    // Query 3: Get permission set assignments
    const permSetAssignmentsQuery = `
      SELECT Id, AssigneeId, PermissionSetId, PermissionSet.Label
      FROM PermissionSetAssignment
    `;

    const permSetResponse = await fetch(
      `${instance_url}/services/data/v59.0/query?q=${encodeURIComponent(permSetAssignmentsQuery)}`,
      { headers: { 'Authorization': `Bearer ${access_token}` } }
    );

    if (!permSetResponse.ok) {
      console.error('Permission set assignments query failed:', await permSetResponse.text());
      throw new Error('Failed to fetch permission set assignments');
    }

    const permSetAssignments = await permSetResponse.json();
    console.log('Permission set assignments found:', permSetAssignments.records.length);

    // Create sets of ProfileIds and ParentIds that have access
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

    console.log('Profiles with access:', profilesWithAccess.size);
    console.log('Permission sets with access:', permSetsWithAccess.size);

    // Find users eligible for platform licenses
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

    console.log('Users eligible for platform licenses:', usersForPlatformLicense.length);
    console.log('Eligible users:', usersForPlatformLicense.map(u => ({ id: u.Id, name: u.Name })));

    return new Response(
      JSON.stringify({
        eligibleUsers: usersForPlatformLicense,
        totalEligible: usersForPlatformLicense.length,
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
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});