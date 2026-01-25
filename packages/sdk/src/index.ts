/**
 * @archipelag/sdk - Official JavaScript/TypeScript SDK for Archipelag.io
 *
 * @example
 * ```typescript
 * import { Archipelag } from '@archipelag/sdk';
 *
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
 *
 * // Image generation
 * const image = await client.generateImage('a sunset over mountains');
 * // image.imageData contains base64-encoded PNG
 * ```
 */

export { Archipelag } from './client';
export * from './types';
export * from './errors';
