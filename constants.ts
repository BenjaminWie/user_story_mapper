import { ProductBoard, BackboneTask, Story, Release, Persona } from './types';
import { FunctionDeclaration, Type } from '@google/genai';

const INITIAL_PERSONAS: Persona[] = [
  { 
    id: 'p1', 
    name: 'Sarah Starter', 
    role: 'Product Manager', 
    avatarUrl: 'https://picsum.photos/100/100', 
    color: '#8b5cf6',
    details: { bio: 'Focused on speed to market.', pain_points: ['Slow dev cycles', 'Unclear requirements'] }
  },
  { 
    id: 'p2', 
    name: 'Dev Dave', 
    role: 'Senior Engineer', 
    avatarUrl: 'https://picsum.photos/101/101', 
    color: '#10b981',
    details: { bio: 'Loves clean code.', pain_points: ['Context switching', 'Vague tickets'] }
  },
];

const INITIAL_TASKS: BackboneTask[] = [
  { id: 'bt1', title: 'Onboarding', order: 0, personaId: 'p1', details: { description: 'User registration flow', technical_research: 'Auth0 vs Custom' } },
  { id: 'bt2', title: 'Search', order: 1, personaId: 'p1', details: { description: 'Finding items', technical_research: 'ElasticSearch implementation' } },
  { id: 'bt3', title: 'Checkout', order: 2, personaId: 'p1', details: { description: 'Payment processing', technical_research: 'Stripe integration' } },
];

const INITIAL_RELEASES: Release[] = [
  { id: 'r1', title: 'MVP Launch', description: 'Core functionality', status: 'active', targetDate: '2024-06-01' },
  { id: 'r2', title: 'V2 Scale', description: 'Performance updates', status: 'planning', targetDate: '2024-09-01' },
];

const INITIAL_STORIES: Story[] = [
  { id: 's1', title: 'Setup Auth0', release_id: 'r1', parent_task_id: 'bt1', status: 'done', category: 'Infra' },
  { id: 's2', title: 'Search Bar UI', release_id: 'r1', parent_task_id: 'bt2', status: 'working', category: 'Design' },
  { id: 's3', title: 'Stripe API', release_id: 'r1', parent_task_id: 'bt3', status: 'todo', category: 'Feature' },
];

export const MOCK_PRODUCTS: ProductBoard[] = [
  {
    id: 'prod-1',
    name: 'LiveOS Core',
    meta: {
      vision: "Build the world's most intuitive project management tool powered by AI.",
      kpis: ['Acquisition', 'Retention'],
      market_analysis: 'High demand for AI tools.'
    },
    personas: INITIAL_PERSONAS,
    tasks: INITIAL_TASKS,
    releases: INITIAL_RELEASES,
    stories: INITIAL_STORIES
  },
  {
    id: 'prod-2',
    name: 'Mobile App',
    meta: {
      vision: "A companion app for on-the-go management.",
    },
    personas: [],
    tasks: [],
    releases: [],
    stories: []
  }
];

// --- Live API Tools ---

export const ADD_STORY_TOOL: FunctionDeclaration = {
  name: 'addStory',
  description: 'Add a new user story (ticket) to the board.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: 'Title of the story' },
      releaseName: { type: Type.STRING, description: 'Target release name' },
      taskName: { type: Type.STRING, description: 'Parent task (backbone) name' },
      category: { type: Type.STRING, description: 'Feature, Bug, Design, etc.' },
    },
    required: ['title', 'releaseName', 'taskName'],
  },
};

export const TOOLS_DECLARATION = [ADD_STORY_TOOL];
