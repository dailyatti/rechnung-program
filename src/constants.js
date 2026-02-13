import { isoToday, isoFOM, isoLOM } from './date-utils.js';

export const STORAGE_KEY = "ab24_enterprise_v4";
export const AUTH_KEY    = "ab24_auth_token";
export const SCHEMA_VER  = 4;
export const DEBOUNCE_MS = 280;
export const MAX_STORAGE_MB = 4;
export const APP_PASSWORD = "100milioEURO.@";

export const DEF_EXTRAS = {
  xmasOn: false, xmasVal: 100,
  newyearOn: false, newyearVal: 100,
  easterOn: false, easterVal: 100,
  travelOn: false, travelVal: 300,
  svsOn: false, svsVal: 341.70,
  adminFeeOn: false, adminFeeVal: 192,
  entryFeeOn: false, entryFeeVal: 480,
  depositOn: false, depositVal: 0,
  cancelFeeOn: false, cancelFeeVal: 800
};

export const PFLEGESTUFE_CONFIG = {
  baseRate: 80,
  perStufe: 10,
  secondPerson: 10,
  nightWork: 10,
  noBreak: 10,
  pet: 5,
  driverLicense: 10,
  goodGermanMin: 90
};

export function createDefaultState() {
  return {
    version: SCHEMA_VER,
    shared: {},
    globalLogo: null,
    persons: [],
    teams: [],
    clients: [],
    assignments: [],
    history: [],
    reminders: [],
    currentInvoice: {
      assignmentId: null,
      invoiceDate: isoToday(),
      invoiceNo: "",
      startDate: isoFOM(),
      endDate: isoLOM(),
      includeLastDay: true,
      payDays: 3
    },
    ui: { selectedClientId: null, activeTab: "invoice" }
  };
}
