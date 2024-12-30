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
    const { access_token, instance_url } = await req.json()
    
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

    // Query for users including platform license information and object permissions
    const userQuery = `
      SELECT Id, Username, LastLoginDate, UserType, Profile.Name, 
             Profile.UserLicense.LicenseDefinitionKey,
             Profile.Id
      FROM User 
      WHERE IsActive = true 
      AND CreatedBy.Name != null
    `;

    // Query for OAuth tokens
    const oauthQuery = `
      SELECT Id, AppName, LastUsedDate, UseCount, UserId
      FROM OAuthToken
      WHERE LastUsedDate >= LAST_N_DAYS:90
    `;

    // Query for object permissions to determine platform license eligibility
    const objectPermissionsQuery = `
      SELECT Parent.Profile.Name, Parent.ProfileId, Parent.Label, ParentId, 
             SObjectType, PermissionsCreate, PermissionsRead, PermissionsEdit, 
             PermissionsDelete, PermissionsModifyAllRecords, PermissionsViewAllRecords 
      FROM ObjectPermissions 
      WHERE SObjectType IN ('Opportunity', 'Lead', 'Case')
    `;

    // Execute all queries in parallel
    const [usersResponse, oauthResponse, objectPermsResponse] = await Promise.all([
      fetch(
        `${instance_url}/services/data/v59.0/query?q=${encodeURIComponent(userQuery)}`,
        {
          headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json',
          },
        }
      ),
      fetch(
        `${instance_url}/services/data/v59.0/query?q=${encodeURIComponent(oauthQuery)}`,
        {
          headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json',
          },
        }
      ),
      fetch(
        `${instance_url}/services/data/v59.0/query?q=${encodeURIComponent(objectPermissionsQuery)}`,
        {
          headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json',
          },
        }
      )
    ]);

    if (!usersResponse.ok || !oauthResponse.ok || !objectPermsResponse.ok) {
      console.error('Salesforce API error:', usersResponse.status, oauthResponse.status, objectPermsResponse.status);
      const errorData = await usersResponse.text();
      console.error('Error details:', errorData);
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch data',
          details: errorData
        }),
        { 
          status: usersResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const [userData, oauthData, objectPermsData] = await Promise.all([
      usersResponse.json(),
      oauthResponse.json(),
      objectPermsResponse.json()
    ]);

    // Create sets of ProfileIds that have access to standard objects
    const profilesWithAccess = new Set(
      objectPermsData.records
        .filter(perm => perm.Parent && perm.Parent.ProfileId)
        .map(perm => perm.Parent.ProfileId)
    );

    // Add platform license eligibility to users
    const usersWithEligibility = userData.records.map(user => ({
      ...user,
      isPlatformEligible: user.Profile?.Id && !profilesWithAccess.has(user.Profile.Id)
    }));

    console.log('Successfully fetched users and OAuth data');
    console.log('Platform eligible users:', usersWithEligibility.filter(u => u.isPlatformEligible).length);
    
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
      },
    )
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
      },
    )
  }
})