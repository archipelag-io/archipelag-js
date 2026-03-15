/**
 * Archipelag.io SDK Types
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

// ===========================================================================
// Batch Jobs
// ===========================================================================

/**
 * A child job within a batch
 */
export interface BatchChild {
  id: string;
  batchIndex: number;
  state: string;
  error?: string;
  hostId?: string;
}

/**
 * Batch configuration and counters
 */
export interface BatchConfig {
  chunkCount: number;
  mergeStrategy: string;
  failMode: string;
  completed: number;
  failed: number;
}

/**
 * A batch job with its children
 */
export interface BatchJob {
  id: string;
  state: string;
  workload: string;
  batch: BatchConfig;
  children: BatchChild[];
  createdAt: string;
}

/**
 * Batch progress information
 */
export interface BatchProgress {
  parentId: string;
  parentState: string;
  chunkCount: number;
  mergeStrategy: string;
  failMode: string;
  childStates: Record<string, number>;
  children: BatchChild[];
}

/**
 * Options for submitting a batch job
 */
export interface BatchOptions {
  mergeStrategy?: 'concat' | 'flatten';
  failMode?: 'best_effort' | 'fail_fast';
  maxParallelism?: number;
  region?: string;
  bidPrice?: number;
}

/**
 * Callback for batch progress updates
 */
export interface BatchProgressCallback {
  (completed: number, failed: number, total: number): void;
}
