import {
  Prisma,
  AssessmentType,
  DurationOfSymptoms,
  ROM,
  MuscleStrength,
  FallRisk,
  VisitFrequency,
} from '@prisma/client';

export interface AssessmentInputPayload {
  assessmentType: AssessmentType;
  chiefComplaint: string[];
  durationOfSymptoms: '< 1 Week' | '1-4 Weeks' | '1-3 Months' | '3-6 Months' | '> 6 Months';
  painScore: number;
  painCharacteristics?: string[];
  rom: 'Full' | 'Mild Restriction' | 'Moderate Restriction' | 'Severe Restriction';
  muscleStrength:
    | 'Normal (5/5)'
    | 'Mild Weakness (4/5)'
    | 'Moderate Weakness (3/5)'
    | 'Severe Weakness (<=2/5)';

  // Step 2 optional fields
  mobilityStatus?: string;
  assistiveDevice?: string;
  fallRisk?: 'Low' | 'Moderate' | 'High';
  functionalLimitations?: string[];

  dateOfSurgery?: string | Date;
  surgeryType?: string;
  sportPlayed?: string;
  mechanismOfInjury?: string;

  cognitiveStatus?: string;
  muscleTone?: string;

  heartRateBpm?: number;
  bloodPressureSys?: number;
  bloodPressureDia?: number;
  spo2Percentage?: number;
  oxygenSupportType?: string;

  // Step 3
  problemsIdentified: string[];
  treatmentPlan: string[];
  visitFrequency: 'Daily' | 'Alternate Days' | '3 Times/Week' | '2 Times/Week' | 'Weekly';
  hepGiven: boolean;
  therapistNotes?: string;
  documentUrls?: string[];
}

const mapDurationOfSymptoms = (val: string): DurationOfSymptoms => {
  switch (val) {
    case '< 1 Week':
      return 'LESS_THAN_ONE_WEEK';
    case '1-4 Weeks':
      return 'ONE_TO_FOUR_WEEKS';
    case '1-3 Months':
      return 'ONE_TO_THREE_MONTHS';
    case '3-6 Months':
      return 'THREE_TO_SIX_MONTHS';
    case '> 6 Months':
      return 'GREATER_THAN_SIX_MONTHS';
    default:
      throw new Error(`Invalid duration value: ${val}`);
  }
};

const mapROM = (val: string): ROM => {
  switch (val) {
    case 'Full':
      return 'Full';
    case 'Mild Restriction':
      return 'Mild_Restriction';
    case 'Moderate Restriction':
      return 'Moderate_Restriction';
    case 'Severe Restriction':
      return 'Severe_Restriction';
    default:
      throw new Error(`Invalid ROM value: ${val}`);
  }
};

const mapMuscleStrength = (val: string): MuscleStrength => {
  switch (val) {
    case 'Normal (5/5)':
      return 'Normal';
    case 'Mild Weakness (4/5)':
      return 'Mild_Weakness';
    case 'Moderate Weakness (3/5)':
      return 'Moderate_Weakness';
    case 'Severe Weakness (<=2/5)':
      return 'Severe_Weakness';
    default:
      throw new Error(`Invalid Muscle Strength value: ${val}`);
  }
};

const mapFallRisk = (val?: string): FallRisk | null => {
  if (!val) return null;
  switch (val) {
    case 'Low':
      return 'Low';
    case 'Moderate':
      return 'Moderate';
    case 'High':
      return 'High';
    default:
      throw new Error(`Invalid Fall Risk value: ${val}`);
  }
};

const mapVisitFrequency = (val: string): VisitFrequency => {
  switch (val) {
    case 'Daily':
      return 'Daily';
    case 'Alternate Days':
      return 'Alternate_Days';
    case '3 Times/Week':
      return 'Three_Times_Week';
    case '2 Times/Week':
      return 'Two_Times_Week';
    case 'Weekly':
      return 'Weekly';
    default:
      throw new Error(`Invalid Visit Frequency value: ${val}`);
  }
};

export const mapClinicalAssessmentPayload = (
  payload: AssessmentInputPayload,
  treatmentPlanId: string,
): Prisma.ClinicalAssessmentCreateInput => {
  return {
    treatmentPlan: {
      connect: { id: treatmentPlanId },
    },
    assessmentType: payload.assessmentType,
    chiefComplaint: payload.chiefComplaint,
    durationOfSymptoms: mapDurationOfSymptoms(payload.durationOfSymptoms),
    painScore: payload.painScore,
    painCharacteristics: payload.painCharacteristics || [],
    rom: mapROM(payload.rom),
    muscleStrength: mapMuscleStrength(payload.muscleStrength),

    // Composite type
    mobilityDetails: {
      mobilityStatus: payload.mobilityStatus || null,
      assistiveDevice: payload.assistiveDevice || null,
      fallRisk: mapFallRisk(payload.fallRisk),
      functionalLimitations: payload.functionalLimitations || [],
    },

    // Conditional details
    surgicalDetails:
      payload.assessmentType === 'POST_SURGICAL'
        ? {
            dateOfSurgery: payload.dateOfSurgery ? new Date(payload.dateOfSurgery) : null,
            surgeryType: payload.surgeryType || null,
          }
        : null,

    sportsDetails:
      payload.assessmentType === 'SPORTS'
        ? {
            sportPlayed: payload.sportPlayed || null,
            mechanismOfInjury: payload.mechanismOfInjury || null,
          }
        : null,

    neurologicalDetails:
      payload.assessmentType === 'NEURO'
        ? {
            cognitiveStatus: payload.cognitiveStatus || null,
            muscleTone: payload.muscleTone || null,
          }
        : null,

    cardiopulmonaryVitals:
      payload.assessmentType === 'CARDIOPULMONARY'
        ? {
            heartRateBpm: payload.heartRateBpm || null,
            bloodPressureSys: payload.bloodPressureSys || null,
            bloodPressureDia: payload.bloodPressureDia || null,
            spo2Percentage: payload.spo2Percentage || null,
            oxygenSupportType: payload.oxygenSupportType || null,
          }
        : null,

    problemsIdentified: payload.problemsIdentified,
    treatmentPlanItems: payload.treatmentPlan,
    visitFrequency: mapVisitFrequency(payload.visitFrequency),
    hepGiven: payload.hepGiven,
    therapistNotes: payload.therapistNotes || null,
    documentUrls: payload.documentUrls || [],
  };
};
