export const fetchOpportunityMetrics = async (instance_url: string, access_token: string) => {
  // Query for total opportunities
  const totalOppsQuery = `
    SELECT 
      CALENDAR_YEAR(CloseDate) yearClosed,
      CALENDAR_MONTH(CloseDate) monthClosed,
      COUNT(Id) totalCount
    FROM Opportunity 
    WHERE CloseDate = LAST_N_DAYS:180 
    AND IsClosed = true
    GROUP BY CALENDAR_YEAR(CloseDate), CALENDAR_MONTH(CloseDate)
    ORDER BY CALENDAR_YEAR(CloseDate) DESC, CALENDAR_MONTH(CloseDate) DESC
  `;

  const totalOppsResponse = await fetch(
    `${instance_url}/services/data/v57.0/query?q=${encodeURIComponent(totalOppsQuery)}`,
    {
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!totalOppsResponse.ok) {
    throw new Error(`Total opportunities query failed: ${totalOppsResponse.statusText}`);
  }

  const totalOpps = await totalOppsResponse.json();

  // Query for won opportunities
  const wonOppsQuery = `
    SELECT 
      CALENDAR_YEAR(CloseDate) yearClosed,
      CALENDAR_MONTH(CloseDate) monthClosed,
      COUNT(Id) wonCount
    FROM Opportunity 
    WHERE CloseDate = LAST_N_DAYS:180 
    AND IsClosed = true
    AND IsWon = true
    GROUP BY CALENDAR_YEAR(CloseDate), CALENDAR_MONTH(CloseDate)
    ORDER BY CALENDAR_YEAR(CloseDate) DESC, CALENDAR_MONTH(CloseDate) DESC
  `;

  const wonOppsResponse = await fetch(
    `${instance_url}/services/data/v57.0/query?q=${encodeURIComponent(wonOppsQuery)}`,
    {
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!wonOppsResponse.ok) {
    throw new Error(`Won opportunities query failed: ${wonOppsResponse.statusText}`);
  }

  const wonOpps = await wonOppsResponse.json();

  return { totalOpps, wonOpps };
};

export const processOpportunityMetrics = (totalOpps: any, wonOpps: any) => {
  const oppMetrics = new Map();
  
  if (totalOpps.records) {
    totalOpps.records.forEach((record: any) => {
      const key = `${record.yearClosed}-${record.monthClosed}`;
      oppMetrics.set(key, {
        Year: record.yearClosed,
        Month: record.monthClosed,
        TotalOpps: record.totalCount,
        WonOpps: 0
      });
    });
  }

  if (wonOpps.records) {
    wonOpps.records.forEach((record: any) => {
      const key = `${record.yearClosed}-${record.monthClosed}`;
      if (oppMetrics.has(key)) {
        const existing = oppMetrics.get(key);
        existing.WonOpps = record.wonCount;
      } else {
        oppMetrics.set(key, {
          Year: record.yearClosed,
          Month: record.monthClosed,
          TotalOpps: 0,
          WonOpps: record.wonCount
        });
      }
    });
  }

  return Array.from(oppMetrics.values());
};