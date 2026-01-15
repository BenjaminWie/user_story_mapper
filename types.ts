
export interface ProductBoard {
  id: string;
  name: string;
  meta: {
    vision: string;
    kpis?: string[];
    market_analysis?: string;
  };
  personas: Persona[];
  phases: JourneyPhase[]; // New L2: The Activity/Phase (e.g., "Onboarding")
  tasks: BackboneTask[]; // The horizontal backbone L3 (e.g., "Sign Up", "Profile")
  releases: Release[];   // The swimlanes (L4)
  stories: Story[];      // The atomic units of work (L5)
}

export interface JourneyPhase {
  id: string;
  title: string;
  order: number;
  color?: string;
}

export interface Persona {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string;
  color: string;
  details?: {
    bio: string;
    pain_points: string[];
  };
}

// Formerly UserStep
export interface BackboneTask {
  id: string;
  phaseId: string; // Link to JourneyPhase
  title: string;
  order: number;
  personaId?: string; // Link to Persona who owns this activity
  details?: {
    description: string;
    technical_research: string;
  };
}

export interface Release {
  id: string;
  title: string;
  description: string;
  status: 'planning' | 'active' | 'completed';
  targetDate?: string;
}

// Formerly Task
export interface Story {
  id: string;
  title: string;
  parent_task_id: string; // Links to BackboneTask
  release_id: string;     // Links to Release
  status: 'todo' | 'working' | 'review' | 'done';
  category: 'Feature' | 'Bug' | 'Design' | 'Research' | 'Infra';
  details?: {
    acceptance_criteria: string[];
    test_cases: string[];
  };
}

export interface LiveSessionStatus {
  isConnected: boolean;
  isSpeaking: boolean;
  error?: string;
}
