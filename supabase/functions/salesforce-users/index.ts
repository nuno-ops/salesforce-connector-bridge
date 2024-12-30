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
      console.error('Missing required parameters');
      return new Response(
        JSON.stringify({ error: 'Missing access_token or instance_url' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Optimized user query with fewer fields and better filtering
    const userQuery = `
      SELECT Id, Username, LastLoginDate, UserType, Profile.Name, 
             Profile.UserLicense.LicenseDefinitionKey,
             Profile.Id
      FROM User 
      WHERE IsActive = true 
      LIMIT 1000
    `;

    // Optimized OAuth query
    const oauthQuery = `
      SELECT Id, AppName, LastUsedDate, UseCount, UserId
      FROM OAuthToken
      WHERE LastUsedDate >= LAST_N_DAYS:90
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

    // Add timeout to fetch calls
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    try {
      // Execute queries with timeout
      const [usersResponse, oauthResponse, objectPermsResponse] = await Promise.all([
        fetch(
          `${instance_url}/services/data/v59.0/query?q=${encodeURIComponent(userQuery)}`,
          {
            headers: {
              'Authorization': `Bearer ${access_token}`,
              'Content-Type': 'application/json',
            },
            signal: controller.signal
          }
        ),
        fetch(
          `${instance_url}/services/data/v59.0/query?q=${encodeURIComponent(oauthQuery)}`,
          {
            headers: {
              'Authorization': `Bearer ${access_token}`,
              'Content-Type': 'application/json',
            },
            signal: controller.signal
          }
        ),
        fetch(
          `${instance_url}/services/data/v59.0/query?q=${encodeURIComponent(objectPermissionsQuery)}`,
          {
            headers: {
              'Authorization': `Bearer ${access_token}`,
              'Content-Type': 'application/json',
            },
            signal: controller.signal
          }
        )
      ]);

      clearTimeout(timeout);

      // Check responses individually
      if (!usersResponse.ok) {
        throw new Error(`Users API error: ${usersResponse.status}`);
      }
      if (!oauthResponse.ok) {
        throw new Error(`OAuth API error: ${oauthResponse.status}`);
      }
      if (!objectPermsResponse.ok) {
        throw new Error(`Permissions API error: ${objectPermsResponse.status}`);
      }

      const [userData, oauthData, objectPermsData] = await Promise.all([
        usersResponse.json(),
        oauthResponse.json(),
        objectPermsResponse.json()
      ]);

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
            'Content-Type': 'application/json' 
          } 
        }
      );

    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('Request timeout');
        return new Response(
          JSON.stringify({ error: 'Request timeout' }),
          { 
            status: 504,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }

  } catch (error) {
    console.error('Error in salesforce-users function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        type: error.name,
        stack: error.stack
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        },
      }
    );
  }
});