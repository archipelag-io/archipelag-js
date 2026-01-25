/**
 * Archipelag SDK Types
 */

export type JobStatus =
  | 'pending'
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'timeout';

export type RuntimeType = 'container' | 'wasm';

export type StreamEventType =
  | 'token'
  | 'status'
  | 'progress'
  | 'image'
  | 'error'
  | 'done';

/**
 * Token/resource usage information
 */
export interface Usage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  creditsUsed: number;
}

/**
 * Job information
 */
export interface Job {
  id: string;
  workloadId: number;
  workloadSlug?: string;
  status: JobStatus;
  input: Record<string, unknown>;
  output?: string;
  error?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  usage?: Usage;
}

/**
 * Streaming event
 */
export interface StreamEvent {
  type: StreamEventType;
  content?: string;
  step?: number;
  total?: number;
  imageData?: string;
  imageFormat?: string;
  error?: string;
  usage?: Usage;
}

/**
 * Chat completion result
 */
export interface ChatResult {
  content: string;
  jobId: string;
  usage: Usage;
  model?: string;
  finishReason?: string;
}

/**
 * Image generation result
 */
export interface ImageResult {
  imageData: string;
  imageFormat: string;
  width: number;
  height: number;
  seed?: number;
  jobId: string;
  usage: Usage;
}

/**
 * Workload information
 */
export interface Workload {
  id: number;
  name: string;
  slug: string;
  description?: string;
  runtimeType: RuntimeType;
  requiredVramMb?: number;
  requiredRamMb?: number;
  pricePerJob: number;
  isEnabled: boolean;
}

/**
 * API key information
 */
export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsedAt?: string;
  expiresAt?: string;
}

/**
 * Account information
 */
export interface Account {
  id: string;
  email: string;
  credits: number;
  createdAt: string;
}

/**
 * Client configuration options
 */
export interface ClientOptions {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}

/**
 * Chat request options
 */
export interface ChatOptions {
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  workload?: string;
}

/**
 * Image generation options
 */
export interface ImageOptions {
  negativePrompt?: string;
  width?: number;
  height?: number;
  steps?: number;
  guidanceScale?: number;
  seed?: number;
  workload?: string;
}

/**
 * Stream callbacks
 */
export interface StreamCallbacks {
  onToken?: (token: string) => void;
  onProgress?: (step: number, total: number) => void;
  onImage?: (imageData: string, format: string) => void;
  onError?: (error: string) => void;
  onDone?: (usage: Usage) => void;
}

/**
 * Job creation request
 */
export interface CreateJobRequest {
  workload: string;
  input: Record<string, unknown>;
}
