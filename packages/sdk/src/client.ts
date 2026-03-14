/**
 * Archipelag.io SDK Client
 */

import { createParser, type ParsedEvent } from 'eventsource-parser';
import {
  ArchipelagError,
  AuthenticationError,
  InsufficientCreditsError,
  JobFailedError,
  NotFoundError,
  RateLimitError,
  ValidationError,
} from './errors';
import type {
  Account,
  ApiKey,
  ChatOptions,
  ChatResult,
  ClientOptions,
  CreateJobRequest,
  ImageOptions,
  ImageResult,
  Job,
  StreamCallbacks,
  StreamEvent,
  Usage,
  Workload,
} from './types';

const DEFAULT_BASE_URL = 'https://api.archipelag.io';
const DEFAULT_TIMEOUT = 60000;

/**
 * Archipelag.io API Client
 *
 * @example
 * ```typescript
 * const client = new Archipelag({ apiKey: 'ak_xxx' });
 *
 * // Chat
 * const result = await client.chat('Hello!');
 * console.log(result.content);
 *
 * // Streaming
 * await client.chatStream('Tell me a story', {
 *   onToken: (token) => process.stdout.write(token),
 *   onDone: (usage) => console.log(`\n[${usage.totalTokens} tokens]`),
 * });
 * ```
 */
export class Archipelag {
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;

  constructor(options: ClientOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl || DEFAULT_BASE_URL).replace(/\/$/, '');
    this.timeout = options.timeout || DEFAULT_TIMEOUT;
  }

  /**
   * Make an API request
   */
  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': '@archipelag/sdk/0.1.0',
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return this.handleResponse<T>(response);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ArchipelagError('Request timed out');
      }
      throw error;
    }
  }

  /**
   * Handle API response
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (response.ok) {
      const data = await response.json();
      return data.data as T;
    }

    let message: string;
    let errorData: Record<string, unknown> | undefined;

    try {
      errorData = await response.json();
      message =
        (errorData?.error as Record<string, unknown>)?.message as string ||
        response.statusText;
    } catch {
      message = response.statusText;
    }

    switch (response.status) {
      case 401:
        throw new AuthenticationError(message);
      case 402:
        throw new InsufficientCreditsError(message);
      case 404:
        throw new NotFoundError(message);
      case 422:
        throw new ValidationError(
          message,
          errorData?.errors as Record<string, string[]>
        );
      case 429:
        const retryAfter = response.headers.get('Retry-After');
        throw new RateLimitError(
          message,
          retryAfter ? parseInt(retryAfter, 10) : undefined
        );
      default:
        throw new ArchipelagError(message, response.status, errorData);
    }
  }

  // ===========================================================================
  // Account
  // ===========================================================================

  /**
   * Get current account information
   */
  async getAccount(): Promise<Account> {
    return this.request<Account>('GET', '/api/v1/account');
  }

  // ===========================================================================
  // Jobs
  // ===========================================================================

  /**
   * Create a new job
   */
  async createJob(workload: string, input: Record<string, unknown>): Promise<Job> {
    return this.request<Job>('POST', '/api/v1/jobs', { workload, input });
  }

  /**
   * Get job by ID
   */
  async getJob(jobId: string): Promise<Job> {
    return this.request<Job>('GET', `/api/v1/jobs/${jobId}`);
  }

  /**
   * List recent jobs
   */
  async listJobs(limit = 20, offset = 0): Promise<Job[]> {
    return this.request<Job[]>(
      'GET',
      `/api/v1/jobs?limit=${limit}&offset=${offset}`
    );
  }

  /**
   * Cancel a job
   */
  async cancelJob(jobId: string): Promise<Job> {
    return this.request<Job>('DELETE', `/api/v1/jobs/${jobId}`);
  }

  /**
   * Wait for a job to complete
   */
  async waitForJob(
    jobId: string,
    pollInterval = 1000,
    timeout?: number
  ): Promise<Job> {
    const start = Date.now();

    while (true) {
      const job = await this.getJob(jobId);

      if (this.isJobComplete(job)) {
        if (job.status === 'failed') {
          throw new JobFailedError(job.error || 'Job failed', jobId);
        }
        return job;
      }

      if (timeout && Date.now() - start > timeout) {
        throw new ArchipelagError(`Job ${jobId} did not complete within ${timeout}ms`);
      }

      await this.sleep(pollInterval);
    }
  }

  /**
   * Stream job output using SSE
   */
  async *streamJob(jobId: string): AsyncGenerator<StreamEvent> {
    const response = await fetch(
      `${this.baseUrl}/api/v1/jobs/${jobId}/stream`,
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'text/event-stream',
        },
      }
    );

    if (!response.ok) {
      await this.handleResponse(response);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new ArchipelagError('No response body');
    }

    const decoder = new TextDecoder();
    const parser = createParser((event: ParsedEvent) => {
      if (event.type === 'event' && event.data) {
        return JSON.parse(event.data) as StreamEvent;
      }
      return null;
    });

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const events = chunk.split('\n\n').filter(Boolean);

        for (const eventStr of events) {
          if (eventStr.startsWith('data: ')) {
            const data = eventStr.slice(6);
            yield this.parseStreamEvent(data);
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  private parseStreamEvent(data: string): StreamEvent {
    const parsed = JSON.parse(data);
    return {
      type: parsed.type || 'token',
      content: parsed.content || parsed.chunk,
      step: parsed.step,
      total: parsed.total,
      imageData: parsed.image_data,
      imageFormat: parsed.format,
      error: parsed.error,
      usage: parsed.usage
        ? {
            promptTokens: parsed.usage.prompt_tokens,
            completionTokens: parsed.usage.completion_tokens,
            totalTokens: parsed.usage.total_tokens,
            creditsUsed: parsed.usage.credits_used || 0,
          }
        : undefined,
    };
  }

  // ===========================================================================
  // Workloads
  // ===========================================================================

  /**
   * List available workloads
   */
  async listWorkloads(): Promise<Workload[]> {
    return this.request<Workload[]>('GET', '/api/v1/workloads');
  }

  /**
   * Get workload by slug
   */
  async getWorkload(slug: string): Promise<Workload> {
    return this.request<Workload>('GET', `/api/v1/workloads/${slug}`);
  }

  // ===========================================================================
  // API Keys
  // ===========================================================================

  /**
   * List API keys
   */
  async listApiKeys(): Promise<ApiKey[]> {
    return this.request<ApiKey[]>('GET', '/api/v1/api-keys');
  }

  /**
   * Create a new API key
   */
  async createApiKey(name: string): Promise<{ apiKey: ApiKey; key: string }> {
    const response = await this.request<{ data: ApiKey; key: string }>(
      'POST',
      '/api/v1/api-keys',
      { name }
    );
    return { apiKey: response.data, key: response.key };
  }

  /**
   * Delete an API key
   */
  async deleteApiKey(keyId: string): Promise<void> {
    await this.request<void>('DELETE', `/api/v1/api-keys/${keyId}`);
  }

  // ===========================================================================
  // High-level helpers
  // ===========================================================================

  /**
   * Send a chat message and get a response
   */
  async chat(prompt: string, options: ChatOptions = {}): Promise<ChatResult> {
    const input: Record<string, unknown> = { prompt };
    if (options.systemPrompt) input.system_prompt = options.systemPrompt;
    if (options.maxTokens) input.max_tokens = options.maxTokens;
    if (options.temperature !== undefined) input.temperature = options.temperature;

    const job = await this.createJob(options.workload || 'llm-chat', input);
    const completed = await this.waitForJob(job.id);

    return {
      content: completed.output || '',
      jobId: completed.id,
      usage: completed.usage || { creditsUsed: 0 },
      finishReason: completed.status === 'completed' ? 'stop' : 'error',
    };
  }

  /**
   * Send a chat message and stream the response
   */
  async chatStream(
    prompt: string,
    callbacks: StreamCallbacks,
    options: ChatOptions = {}
  ): Promise<void> {
    const input: Record<string, unknown> = { prompt };
    if (options.systemPrompt) input.system_prompt = options.systemPrompt;
    if (options.maxTokens) input.max_tokens = options.maxTokens;
    if (options.temperature !== undefined) input.temperature = options.temperature;

    const job = await this.createJob(options.workload || 'llm-chat', input);

    for await (const event of this.streamJob(job.id)) {
      switch (event.type) {
        case 'token':
          callbacks.onToken?.(event.content || '');
          break;
        case 'progress':
          callbacks.onProgress?.(event.step || 0, event.total || 0);
          break;
        case 'image':
          callbacks.onImage?.(event.imageData || '', event.imageFormat || 'png');
          break;
        case 'error':
          callbacks.onError?.(event.error || 'Unknown error');
          break;
        case 'done':
          callbacks.onDone?.(event.usage || { creditsUsed: 0 });
          break;
      }
    }
  }

  /**
   * Generate an image from a text prompt
   */
  async generateImage(
    prompt: string,
    options: ImageOptions = {}
  ): Promise<ImageResult> {
    const input: Record<string, unknown> = {
      prompt,
      width: options.width || 1024,
      height: options.height || 1024,
      steps: options.steps || 30,
      guidance_scale: options.guidanceScale || 7.5,
    };
    if (options.negativePrompt) input.negative_prompt = options.negativePrompt;
    if (options.seed !== undefined) input.seed = options.seed;

    const job = await this.createJob(options.workload || 'sdxl', input);
    const completed = await this.waitForJob(job.id);

    const output = JSON.parse(completed.output || '{}');

    return {
      imageData: output.image_data || '',
      imageFormat: output.format || 'png',
      width: output.width || options.width || 1024,
      height: output.height || options.height || 1024,
      seed: output.seed,
      jobId: completed.id,
      usage: completed.usage || { creditsUsed: 0 },
    };
  }

  /**
   * Create multiple jobs at once
   */
  async batch(jobs: CreateJobRequest[]): Promise<Job[]> {
    const created: Job[] = [];
    for (const spec of jobs) {
      const job = await this.createJob(spec.workload, spec.input);
      created.push(job);
    }
    return created;
  }

  /**
   * Wait for multiple jobs to complete
   */
  async waitAll(
    jobs: Job[],
    pollInterval = 1000,
    timeout?: number
  ): Promise<Job[]> {
    const results: Job[] = [];
    for (const job of jobs) {
      const completed = await this.waitForJob(job.id, pollInterval, timeout);
      results.push(completed);
    }
    return results;
  }

  // ===========================================================================
  // Helpers
  // ===========================================================================

  private isJobComplete(job: Job): boolean {
    return ['completed', 'failed', 'cancelled', 'timeout'].includes(job.status);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
