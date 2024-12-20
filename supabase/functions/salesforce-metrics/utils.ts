export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const handleCorsRequest = () => {
  return new Response(null, { headers: corsHeaders });
};

export const createErrorResponse = (error: Error) => {
  return new Response(
    JSON.stringify({ error: error.message }),
    {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
};

export const createSuccessResponse = (data: any) => {
  return new Response(
    JSON.stringify(data),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
};