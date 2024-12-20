export const fetchLeadMetrics = async (instance_url: string, access_token: string) => {
  // Query for total leads
  const totalLeadsQuery = `
    SELECT 
      CALENDAR_YEAR(CreatedDate) yearCreated,
      CALENDAR_MONTH(CreatedDate) monthCreated,
      COUNT(Id) totalCount
    FROM Lead 
    WHERE CreatedDate = LAST_N_DAYS:180 
    GROUP BY CALENDAR_YEAR(CreatedDate), CALENDAR_MONTH(CreatedDate)
    ORDER BY CALENDAR_YEAR(CreatedDate) DESC, CALENDAR_MONTH(CreatedDate) DESC
  `;

  const totalLeadsResponse = await fetch(
    `${instance_url}/services/data/v57.0/query?q=${encodeURIComponent(totalLeadsQuery)}`,
    {
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!totalLeadsResponse.ok) {
    throw new Error(`Total leads query failed: ${totalLeadsResponse.statusText}`);
  }

  const totalLeads = await totalLeadsResponse.json();

  // Query for converted leads
  const convertedLeadsQuery = `
    SELECT 
      CALENDAR_YEAR(CreatedDate) yearCreated,
      CALENDAR_MONTH(CreatedDate) monthCreated,
      COUNT(Id) convertedCount
    FROM Lead 
    WHERE CreatedDate = LAST_N_DAYS:180 
    AND IsConverted = TRUE
    GROUP BY CALENDAR_YEAR(CreatedDate), CALENDAR_MONTH(CreatedDate)
    ORDER BY CALENDAR_YEAR(CreatedDate) DESC, CALENDAR_MONTH(CreatedDate) DESC
  `;

  const convertedLeadsResponse = await fetch(
    `${instance_url}/services/data/v57.0/query?q=${encodeURIComponent(convertedLeadsQuery)}`,
    {
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!convertedLeadsResponse.ok) {
    throw new Error(`Converted leads query failed: ${convertedLeadsResponse.statusText}`);
  }

  const convertedLeads = await convertedLeadsResponse.json();

  return { totalLeads, convertedLeads };
};

export const processLeadMetrics = (totalLeads: any, convertedLeads: any) => {
  const leadMetrics = new Map();
  
  if (totalLeads.records) {
    totalLeads.records.forEach((record: any) => {
      const key = `${record.yearCreated}-${record.monthCreated}`;
      leadMetrics.set(key, {
        Year: record.yearCreated,
        Month: record.monthCreated,
        TotalLeads: record.totalCount,
        ConvertedLeads: 0
      });
    });
  }

  if (convertedLeads.records) {
    convertedLeads.records.forEach((record: any) => {
      const key = `${record.yearCreated}-${record.monthCreated}`;
      if (leadMetrics.has(key)) {
        const existing = leadMetrics.get(key);
        existing.ConvertedLeads = record.convertedCount;
      } else {
        leadMetrics.set(key, {
          Year: record.yearCreated,
          Month: record.monthCreated,
          TotalLeads: 0,
          ConvertedLeads: record.convertedCount
        });
      }
    });
  }

  return Array.from(leadMetrics.values());
};