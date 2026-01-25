/**
 * useImage hook for image generation
 */

import { useCallback, useState } from 'react';
import type { ImageOptions, Usage } from '@archipelag/sdk';
import { useArchipelag } from '../context';

export interface GeneratedImage {
  imageData: string;
  imageFormat: string;
  width: number;
  height: number;
  seed?: number;
  jobId: string;
  prompt: string;
}

export interface UseImageOptions extends ImageOptions {
  /**
   * Called when generation starts
   */
  onStart?: () => void;
  /**
   * Called on progress update
   */
  onProgress?: (step: number, total: number) => void;
  /**
   * Called when generation completes
   */
  onFinish?: (image: GeneratedImage, usage: Usage) => void;
  /**
   * Called on error
   */
  onError?: (error: Error) => void;
}

export interface UseImageReturn {
  /**
   * Generate an image
   */
  generate: (prompt: string, options?: ImageOptions) => Promise<GeneratedImage | null>;
  /**
   * Whether generation is in progress
   */
  isLoading: boolean;
  /**
   * Current progress (0-100)
   */
  progress: number;
  /**
   * Last generated image
   */
  image: GeneratedImage | null;
  /**
   * All generated images in this session
   */
  images: GeneratedImage[];
  /**
   * Last error
   */
  error: Error | null;
  /**
   * Clear all images
   */
  clear: () => void;
}

/**
 * Hook for image generation
 *
 * @example
 * ```tsx
 * function ImageGenerator() {
 *   const { generate, isLoading, progress, image, images } = useImage();
 *
 *   return (
 *     <div>
 *       <button
 *         onClick={() => generate('a sunset over mountains')}
 *         disabled={isLoading}
 *       >
 *         Generate
 *       </button>
 *       {isLoading && <progress value={progress} max={100} />}
 *       {image && (
 *         <img
 *           src={`data:image/${image.imageFormat};base64,${image.imageData}`}
 *           alt={image.prompt}
 *         />
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useImage(options: UseImageOptions = {}): UseImageReturn {
  const { client } = useArchipelag();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [image, setImage] = useState<GeneratedImage | null>(null);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const generate = useCallback(
    async (
      prompt: string,
      generateOptions: ImageOptions = {}
    ): Promise<GeneratedImage | null> => {
      if (isLoading) return null;

      setError(null);
      setIsLoading(true);
      setProgress(0);
      options.onStart?.();

      try {
        const mergedOptions = { ...options, ...generateOptions };
        const result = await client.generateImage(prompt, mergedOptions);

        const generatedImage: GeneratedImage = {
          imageData: result.imageData,
          imageFormat: result.imageFormat,
          width: result.width,
          height: result.height,
          seed: result.seed,
          jobId: result.jobId,
          prompt,
        };

        setImage(generatedImage);
        setImages((prev) => [...prev, generatedImage]);
        setProgress(100);
        options.onFinish?.(generatedImage, result.usage);

        return generatedImage;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options.onError?.(error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [client, isLoading, options]
  );

  const clear = useCallback(() => {
    setImage(null);
    setImages([]);
    setProgress(0);
    setError(null);
  }, []);

  return {
    generate,
    isLoading,
    progress,
    image,
    images,
    error,
    clear,
  };
}
