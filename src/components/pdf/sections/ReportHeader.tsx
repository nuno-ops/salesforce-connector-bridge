import { format } from 'date-fns';

export const ReportHeader = () => {
  return (
    <div className="text-center mb-12">
      <h1 className="text-3xl font-bold text-sf-blue mb-2">Salesforce Organization Report</h1>
      <p className="text-muted-foreground">Generated on {format(new Date(), 'PPP')}</p>
    </div>
  );
};