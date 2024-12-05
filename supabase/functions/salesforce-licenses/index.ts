import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { access_token, instance_url } = await req.json()

    // Fetch User Licenses
    const userLicensesResponse = await fetch(
      `${instance_url}/services/data/v57.0/query?q=SELECT Id, Name, TotalLicenses, UsedLicenses FROM UserLicense`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    )

    const userLicenses = await userLicensesResponse.json()

    // Fetch Package Licenses
    const packageLicensesResponse = await fetch(
      `${instance_url}/services/data/v57.0/query?q=SELECT Id, NamespacePrefix, Status, IsProvisioned, AllowedLicenses, UsedLicenses FROM PackageLicense`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    )

    const packageLicenses = await packageLicensesResponse.json()

    // Fetch Permission Set Licenses
    const permissionSetLicensesResponse = await fetch(
      `${instance_url}/services/data/v57.0/query?q=SELECT Id, DeveloperName, TotalLicenses, UsedLicenses FROM PermissionSetLicense`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    )

    const permissionSetLicenses = await permissionSetLicensesResponse.json()

    return new Response(
      JSON.stringify({
        userLicenses: userLicenses.records,
        packageLicenses: packageLicenses.records,
        permissionSetLicenses: permissionSetLicenses.records,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})