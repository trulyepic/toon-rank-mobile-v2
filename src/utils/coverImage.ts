import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import type { ImagePickerAsset } from "expo-image-picker";

export const TITLE_COVER_SPEC = {
  width: 600,
  height: 900,
  maxSizeKB: 800,
  pickerAspect: [2, 3] as [number, number],
};

export const DETAIL_COVER_SPEC = {
  width: 600,
  height: 400,
  maxSizeKB: 800,
  pickerAspect: [3, 2] as [number, number],
};

export type PreparedCoverImage = {
  uri: string;
  mimeType: string;
  width: number;
  height: number;
  sizeKB: number;
};

type CoverSpec = typeof TITLE_COVER_SPEC | typeof DETAIL_COVER_SPEC;

function estimateBase64Bytes(base64?: string) {
  if (!base64) return Number.POSITIVE_INFINITY;
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return Math.ceil((base64.length * 3) / 4) - padding;
}

function centerCropForRatio(asset: ImagePickerAsset, targetRatio: number) {
  const width = asset.width || 1;
  const height = asset.height || 1;
  const currentRatio = width / height;

  if (currentRatio > targetRatio) {
    const cropWidth = Math.round(height * targetRatio);
    return {
      originX: Math.max(0, Math.round((width - cropWidth) / 2)),
      originY: 0,
      width: cropWidth,
      height,
    };
  }

  const cropHeight = Math.round(width / targetRatio);
  return {
    originX: 0,
    originY: Math.max(0, Math.round((height - cropHeight) / 2)),
    width,
    height: cropHeight,
  };
}

export async function prepareCoverImage(
  asset: ImagePickerAsset,
  spec: CoverSpec,
): Promise<PreparedCoverImage> {
  const maxBytes = spec.maxSizeKB * 1024;
  const crop = centerCropForRatio(asset, spec.width / spec.height);
  const qualitySteps = [0.92, 0.86, 0.8, 0.74, 0.68, 0.62, 0.56, 0.5];

  for (const compress of qualitySteps) {
    const result = await manipulateAsync(
      asset.uri,
      [{ crop }, { resize: { width: spec.width, height: spec.height } }],
      {
        compress,
        format: SaveFormat.JPEG,
        base64: true,
      },
    );
    const sizeBytes = estimateBase64Bytes(result.base64);
    if (sizeBytes <= maxBytes) {
      return {
        uri: result.uri,
        mimeType: "image/jpeg",
        width: result.width,
        height: result.height,
        sizeKB: Math.ceil(sizeBytes / 1024),
      };
    }
  }

  throw new Error(
    `The edited image could not be compressed under ${spec.maxSizeKB}KB. Try choosing a simpler crop or a smaller source image.`,
  );
}
