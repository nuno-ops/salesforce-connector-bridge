import { OpenAIResponse, ToolsList } from './types.ts';

const SYSTEM_PROMPT = `You are a software license optimization expert. Analyze ONLY third-party/external tools (excluding native Salesforce tools) and provide specific, actionable recommendations for cost savings. 

Native Salesforce tools to exclude from analysis:
- Salesforce mobile apps (iOS, Android)
- Salesforce CLI
- Salesforce Workbench
- Salesforce Advanced Search
- Salesforce Chatter
- SfdcSIQCloudActivity
- SfdcSIQActivitySyncEngine
- SfdcSiqActivityPlatform
- Any tool with 'salesforce' or 'sfdc' in the name
- Any tool clearly part of core Salesforce

Focus only on external tools where organizations can achieve real cost savings through consolidation or removal.

For potential savings, provide per-user costs when available (e.g., "$15/user/month for Zoom"). Only show specific dollar amounts when you can find real pricing online. Do not show any dollar amounts if you cannot find real pricing data online.

Return ONLY the JSON object, no markdown formatting or additional text.`;

export async function analyzeToolsWithOpenAI(toolsList: ToolsList[], openAIApiKey: string): Promise<OpenAIResponse> {
  console.log('Sending request to OpenAI with tools list:', JSON.stringify(toolsList, null, 2));

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { 
          role: 'user', 
          content: `Analyze these connected apps and identify potential redundancies and cost-saving opportunities among external tools only. Here's the data:

${JSON.stringify(toolsList, null, 2)}

Please provide a structured analysis in the following JSON format:
{
  "categories": [
    {
      "category": "string (e.g., Communication, Automation, etc.)",
      "tools": ["tool names in this category"],
      "action": "string (specific recommendation)",
      "potentialSavings": "string (cost per user when available, otherwise do not include savings)"
    }
  ]
}

Focus on:
1. External tools with overlapping functionality
2. Underutilized third-party tools (low use count or not recently used)
3. Opportunities for consolidation among external tools
4. Specific actionable recommendations for cost reduction
5. Per-user pricing when available online, do not include if not available`
        }
      ],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('OpenAI API error response:', errorData);
    throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
  }

  const aiResponse = await response.json();
  console.log('Received response from OpenAI:', JSON.stringify(aiResponse, null, 2));

  if (!aiResponse?.choices?.[0]?.message?.content) {
    console.error('Invalid OpenAI response format:', aiResponse);
    throw new Error('Invalid response format from OpenAI');
  }

  return parseOpenAIResponse(aiResponse.choices[0].message.content);
}

function parseOpenAIResponse(content: string): OpenAIResponse {
  try {
    const cleanContent = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    console.log('Cleaned content:', cleanContent);
    const analysis = JSON.parse(cleanContent);
    console.log('Parsed analysis:', JSON.stringify(analysis, null, 2));
    
    if (!analysis?.categories || !Array.isArray(analysis.categories)) {
      throw new Error('Invalid analysis structure');
    }
    
    return analysis;
  } catch (error) {
    console.error('Error parsing OpenAI response:', error);
    throw new Error('Failed to parse OpenAI response as JSON');
  }
}