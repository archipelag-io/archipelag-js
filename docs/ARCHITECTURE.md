# JavaScript SDK Architecture

> Internal developer documentation for the Archipelag.io JavaScript SDK.

## Overview

Monorepo containing the core SDK and React hooks for building applications on Archipelag.io.

## Package Structure

```
packages/
├── sdk/                    # @archipelag/sdk
│   └── src/
│       ├── index.ts       # Public exports
│       ├── client.ts      # Archipelag class
│       ├── types.ts       # TypeScript types
│       └── errors.ts      # Error classes
└── react/                  # @archipelag/react
    └── src/
        ├── index.ts       # Public exports
        ├── context.tsx    # ArchipelagProvider
        └── hooks/
            ├── useChat.ts
            └── useImage.ts
```

## SDK API

### Archipelag Client

```typescript
const client = new Archipelag({
  apiKey: 'ak_xxx',
  baseUrl: 'https://api.archipelag.io',
  timeout: 60000,
});

// High-level methods
await client.chat(prompt, options);
await client.chatStream(prompt, callbacks);
await client.generateImage(prompt, options);

// Job management
await client.createJob(workload, input);
await client.getJob(jobId);
await client.waitForJob(jobId);
await client.streamJob(jobId);
await client.cancelJob(jobId);

// Batch operations
await client.batch(jobs);
await client.waitAll(jobs);

// Account
await client.getAccount();
await client.listApiKeys();
await client.createApiKey(name);
```

### Error Handling

```typescript
class ArchipelagError extends Error
class AuthenticationError extends ArchipelagError  // 401
class InsufficientCreditsError extends ArchipelagError  // 402
class NotFoundError extends ArchipelagError  // 404
class RateLimitError extends ArchipelagError  // 429 (has retryAfter)
class JobFailedError extends ArchipelagError
```

## React Package

### Provider

```tsx
<ArchipelagProvider apiKey="ak_xxx">
  <App />
</ArchipelagProvider>
```

### useChat Hook

```tsx
const {
  messages,           // ChatMessage[]
  send,              // (content) => Promise<void>
  isLoading,         // boolean
  streamingContent,  // string
  clear,             // () => void
} = useChat({
  systemPrompt: 'You are helpful',
  maxTokens: 500,
});
```

### useImage Hook

```tsx
const {
  generate,   // (prompt, options) => Promise<GeneratedImage>
  isLoading,
  progress,   // 0-100
  image,      // GeneratedImage | null
} = useImage({
  width: 1024,
  height: 1024,
  steps: 30,
});
```

## Streaming

The SDK uses Server-Sent Events for streaming:

```typescript
for await (const event of client.streamJob(jobId)) {
  switch (event.type) {
    case 'token': console.log(event.content); break;
    case 'progress': console.log(`${event.step}/${event.total}`); break;
    case 'image': console.log(event.imageData); break;
    case 'done': console.log(event.usage); break;
  }
}
```

## Building

```bash
# Install dependencies
mise run setup

# Build all packages
mise run build

# Watch mode
mise run dev

# Run tests
mise run test

# Lint
mise run lint

# Type check
mise run typecheck

# Publish
mise run publish
```

## Dependencies

- `eventsource-parser` - SSE parsing for streaming
- `tsup` - TypeScript bundler
- `vitest` - Testing framework
- `turbo` - Monorepo task orchestration
