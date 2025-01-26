/**
 * DataNode represents either a "data" section or a "wizard" section,
 * with children for data, or questions for a wizard.
 */
export interface DataNode {
  id: string;
  title: string;
  icon: string;
  description: string;
  children: Array<{
    icon: string;
    label: string;
    value: string;
  }>;
  questions: Array<{
    id: string;
    type: 'text' | 'select' | 'multiselect' | 'photo' | 'multiphoto';
    question: string;
    options?: string[];
    refId?: string;
  }>;
  isWizard: boolean;
}

/**
 * You mentioned your UI uses these four sections, so we'll keep them.
 * Each key corresponds to a section in your data.
 */

export interface DataStructure {
  productInfo: DataNode;
  installationProcess: DataNode;
  maintenanceLog: DataNode;
  startInstallation: DataNode;
}

/** WizardQuestion is used only in wizard sections */
export interface WizardQuestion {
  id: string;
  type: 'text' | 'select' | 'multiselect' | 'photo' | 'multiphoto';
  question: string;
  options?: string[];
  // You can include refId or other fields from your schema if you need them:
  refId?: string;
}

/**
 * Our DataContextType holds the data structure, loading/error states,
 * plus helper methods to reload data or get wizard questions.
 */

export interface DataContextType {
  data: DataStructure | null;
  isLoading: boolean;
  error: string | null;
  projectId: string;
  reloadData: () => Promise<void>;
  getWizardQuestions: () => Promise<WizardQuestion[]>;
}
