import type { SankeyDataset } from '../types/sankey.ts';
import { parseSurveyMatrix } from './dataParser.ts';

export const SAMPLE_GSBPM_CSV = `Survey Name,Specify Needs,Design,Build,Collect,Process,Analyse,Disseminate,Evaluate,Division,Frequency
Labour Force Survey (LFS),Jira & Confluence,Enterprise Architect,Blaise 5 Studio,Blaise CATI/CAPI,SPSS & SAS Server,R Studio & Posit,Nomis & Web Bulletins,Qualtrics Survey,Social Surveys,Monthly
Monthly Business Survey (MBS),Jira & Confluence,Visio & Miro,EQ Authoring,Electronic Questionnaire (EQ),PySpark & DAP,SAS Analytics,Open Data API,Confluence Retrospective,Business Statistics,Monthly
Annual Population Survey (APS),Service Design Board,Enterprise Architect,Blaise 5 Studio,Blaise CAPI,PySpark & Splink,R Studio & Posit,Nomis & Web Bulletins,Annual Review Board,Social Surveys,Annual
Retail Sales Index (RSI),Business Change Board,Visio & Miro,EQ Authoring,Electronic Questionnaire (EQ),Python ETL Pipe,R Shiny Dashboards,Open Data API,Team Retrospective,Economic Statistics,Monthly
Census & Demographic Model,Cabinet Office Mandate,Enterprise Architect,Custom React & Microservices,Electronic Questionnaire (EQ),Record Linkage Engine,Bayesian Model / Stan,Secure Research Service (SRS),National Statistics Quality Review,Census Directorate,Decennial
International Passenger Survey (IPS),Border Force Consult,Visio & Miro,Custom Tablet App,Tablet CAPI Fieldwork,SAS Server,SAS Analytics,National Statistical Bulletins,Border Force Feedback,Migration & Travel,Quarterly
Wealth and Assets Survey (WAS),Service Design Board,Blaise 5 Studio,Blaise 5 Studio,Blaise CAPI,SPSS & SAS Server,R Studio & Posit,Secure Research Service (SRS),Qualtrics Survey,Social Surveys,Biennial
Construction Output Survey,Business Change Board,Visio & Miro,EQ Authoring,Electronic Questionnaire (EQ),Python ETL Pipe,R Shiny Dashboards,Web Bulletins & Excel,Team Retrospective,Business Statistics,Monthly
COVID-19 Infection Survey (CIS),DHSC Urgent Directive,Rapid Prototyping,EQ Authoring,EQ & Field Couriers,PySpark & Splink,Bayesian Model / Stan,Open Data API,Health Review Council,Health & Life Events,Ad-hoc / Rapid
Producer Price Index (PPI),Economic Strategy Board,Enterprise Architect,Oracle Forms,Electronic Questionnaire (EQ),Oracle DB & SQL,SAS Analytics,Open Data API,Economic Review Board,Prices & Inflation,Monthly`;

const parsedSample = parseSurveyMatrix(
  [
    {
      'Survey Name': 'Labour Force Survey (LFS)',
      'Specify Needs': 'Jira & Confluence',
      'Design': 'Enterprise Architect',
      'Build': 'Blaise 5 Studio',
      'Collect': 'Blaise CATI/CAPI',
      'Process': 'SPSS & SAS Server',
      'Analyse': 'R Studio & Posit',
      'Disseminate': 'Nomis & Web Bulletins',
      'Evaluate': 'Qualtrics Survey',
      'Division': 'Social Surveys',
      'Frequency': 'Monthly'
    },
    {
      'Survey Name': 'Monthly Business Survey (MBS)',
      'Specify Needs': 'Jira & Confluence',
      'Design': 'Visio & Miro',
      'Build': 'EQ Authoring',
      'Collect': 'Electronic Questionnaire (EQ)',
      'Process': 'PySpark & DAP',
      'Analyse': 'SAS Analytics',
      'Disseminate': 'Open Data API',
      'Evaluate': 'Confluence Retrospective',
      'Division': 'Business Statistics',
      'Frequency': 'Monthly'
    },
    {
      'Survey Name': 'Annual Population Survey (APS)',
      'Specify Needs': 'Service Design Board',
      'Design': 'Enterprise Architect',
      'Build': 'Blaise 5 Studio',
      'Collect': 'Blaise CAPI',
      'Process': 'PySpark & Splink',
      'Analyse': 'R Studio & Posit',
      'Disseminate': 'Nomis & Web Bulletins',
      'Evaluate': 'Annual Review Board',
      'Division': 'Social Surveys',
      'Frequency': 'Annual'
    },
    {
      'Survey Name': 'Retail Sales Index (RSI)',
      'Specify Needs': 'Business Change Board',
      'Design': 'Visio & Miro',
      'Build': 'EQ Authoring',
      'Collect': 'Electronic Questionnaire (EQ)',
      'Process': 'Python ETL Pipe',
      'Analyse': 'R Shiny Dashboards',
      'Disseminate': 'Open Data API',
      'Evaluate': 'Team Retrospective',
      'Division': 'Economic Statistics',
      'Frequency': 'Monthly'
    },
    {
      'Survey Name': 'Census & Demographic Model',
      'Specify Needs': 'Cabinet Office Mandate',
      'Design': 'Enterprise Architect',
      'Build': 'Custom React & Microservices',
      'Collect': 'Electronic Questionnaire (EQ)',
      'Process': 'Record Linkage Engine',
      'Analyse': 'Bayesian Model / Stan',
      'Disseminate': 'Secure Research Service (SRS)',
      'Evaluate': 'National Statistics Quality Review',
      'Division': 'Census Directorate',
      'Frequency': 'Decennial'
    },
    {
      'Survey Name': 'International Passenger Survey (IPS)',
      'Specify Needs': 'Border Force Consult',
      'Design': 'Visio & Miro',
      'Build': 'Custom Tablet App',
      'Collect': 'Tablet CAPI Fieldwork',
      'Process': 'SAS Server',
      'Analyse': 'SAS Analytics',
      'Disseminate': 'National Statistical Bulletins',
      'Evaluate': 'Border Force Feedback',
      'Division': 'Migration & Travel',
      'Frequency': 'Quarterly'
    },
    {
      'Survey Name': 'Wealth and Assets Survey (WAS)',
      'Specify Needs': 'Service Design Board',
      'Design': 'Blaise 5 Studio',
      'Build': 'Blaise 5 Studio',
      'Collect': 'Blaise CAPI',
      'Process': 'SPSS & SAS Server',
      'Analyse': 'R Studio & Posit',
      'Disseminate': 'Secure Research Service (SRS)',
      'Evaluate': 'Qualtrics Survey',
      'Division': 'Social Surveys',
      'Frequency': 'Biennial'
    },
    {
      'Survey Name': 'Construction Output Survey',
      'Specify Needs': 'Business Change Board',
      'Design': 'Visio & Miro',
      'Build': 'EQ Authoring',
      'Collect': 'Electronic Questionnaire (EQ)',
      'Process': 'Python ETL Pipe',
      'Analyse': 'R Shiny Dashboards',
      'Disseminate': 'Web Bulletins & Excel',
      'Evaluate': 'Team Retrospective',
      'Division': 'Business Statistics',
      'Frequency': 'Monthly'
    },
    {
      'Survey Name': 'COVID-19 Infection Survey (CIS)',
      'Specify Needs': 'DHSC Urgent Directive',
      'Design': 'Rapid Prototyping',
      'Build': 'EQ Authoring',
      'Collect': 'EQ & Field Couriers',
      'Process': 'PySpark & Splink',
      'Analyse': 'Bayesian Model / Stan',
      'Disseminate': 'Open Data API',
      'Evaluate': 'Health Review Council',
      'Division': 'Health & Life Events',
      'Frequency': 'Ad-hoc / Rapid'
    },
    {
      'Survey Name': 'Producer Price Index (PPI)',
      'Specify Needs': 'Economic Strategy Board',
      'Design': 'Enterprise Architect',
      'Build': 'Oracle Forms',
      'Collect': 'Electronic Questionnaire (EQ)',
      'Process': 'Oracle DB & SQL',
      'Analyse': 'SAS Analytics',
      'Disseminate': 'Open Data API',
      'Evaluate': 'Economic Review Board',
      'Division': 'Prices & Inflation',
      'Frequency': 'Monthly'
    }
  ],
  'ONS Survey Portfolio (GSBPM Model)'
);

export const SAMPLE_DATASET_ONS: SankeyDataset = parsedSample.dataset || {
  name: 'ONS Survey Portfolio (GSBPM Model)',
  description: 'Flow of ONS statistical surveys across GSBPM stages and platforms.',
  nodes: [],
  links: [],
  surveys: []
};

export const SAMPLE_CSV_TEMPLATE = SAMPLE_GSBPM_CSV;
