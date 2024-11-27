import { Page } from "./Page.model";

export interface ConfigurationSchedule {
  id: number;
  page: Page;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  hour?: number | null;
  minute?: number | null;
  day_of_week?: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun' | null;
  day?: number | null;
}
