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

    // Check for required credentials
    if (!access_token || !instance_url) {
      console.error('Missing credentials:', { access_token: !!access_token, instance_url: !!instance_url });
      throw new Error('Missing access_token or instance_url');
    }

    // Verify authorization header is present
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header present');
      return new Response(
        JSON.stringify({ error: 'No authorization header present' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
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
    console.log('Sample object permission:', JSON.stringify(objectPerms.records[0], null, 2));

    console.log('Fetching users...');
    // Query 2: Get users - removed UserType filter
    const usersQuery = `
      SELECT Id, Name, ProfileId, UserType, IsActive, Profile.Name, Email, LastLoginDate
      FROM User
      WHERE IsActive = true
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
    console.log('User types distribution:', users.records.reduce((acc, user) => {
      acc[user.UserType] = (acc[user.UserType] || 0) + 1;
      return acc;
    }, {}));

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

    // Create sets of ProfileIds and ParentIds that have access, with null checks
    const profilesWithAccess = new Set(
      objectPerms.records
        .filter(perm => perm.Parent && perm.Parent.ProfileId)
        .map(perm => perm.Parent.ProfileId)
    );

    const permSetsWithAccess = new Set(
      objectPerms.records
        .filter(perm => perm.ParentId && !perm.Parent?.ProfileId)
        .map(perm => perm.ParentId)
    );

    console.log('Profiles with access:', profilesWithAccess.size);
    console.log('Permission sets with access:', permSetsWithAccess.size);

    // Find users eligible for platform licenses
    const usersForPlatformLicense = users.records.filter(user => {
      // Skip users without ProfileId
      if (!user.ProfileId) {
        console.log(`User ${user.Name} (${user.Id}) has no ProfileId, skipping`);
        return false;
      }

      // Check if user's profile doesn't have access
      if (profilesWithAccess.has(user.ProfileId)) {
        return false;
      }

      // Get user's permission sets
      const userPermSets = permSetAssignments.records
        .filter(psa => psa.AssigneeId === user.Id)
        .map(psa => psa.PermissionSetId);

      // Check if user has any permission set that grants access
      return !userPermSets.some(psId => permSetsWithAccess.has(psId));
    });

    console.log('Users eligible for platform licenses:', usersForPlatformLicense.length);
    console.log('Eligible users:', usersForPlatformLicense.map(u => ({ 
      id: u.Id, 
      name: u.Name,
      type: u.UserType,
      profile: u.Profile?.Name
    })));

    return new Response(
      JSON.stringify({
        eligibleUsers: usersForPlatformLicense,
        totalEligible: usersForPlatformLicense.length,
        debug: {
          totalProfiles: profilesWithAccess.size,
          totalPermSets: permSetsWithAccess.size,
          totalUsers: users.records.length,
          totalAssignments: permSetAssignments.records.length,
          userTypesDistribution: users.records.reduce((acc, user) => {
            acc[user.UserType] = (acc[user.UserType] || 0) + 1;
            return acc;
          }, {})
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in platform license calculation:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        totalEligible: 0,
        eligibleUsers: []
      }),
      { 
        status: error.status || 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});