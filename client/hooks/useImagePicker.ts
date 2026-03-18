import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { usePermissions } from './usePermissions';

interface PickedImage {
  uri: string;
  width: number;
  height: number;
  fileSize?: number;
}

interface UseImagePickerReturn {
  image: PickedImage | null;
  isLoading: boolean;
  pickFromCamera: () => Promise<PickedImage | null>;
  pickFromGallery: () => Promise<PickedImage | null>;
  clearImage: () => void;
}

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  quality: 0.85,
  allowsEditing: true,
  aspect: [4, 3],
};

export function useImagePicker(): UseImagePickerReturn {
  const [image, setImage] = useState<PickedImage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { requestCamera, requestMediaLibrary } = usePermissions();

  const pickFromCamera = useCallback(async (): Promise<PickedImage | null> => {
    const granted = await requestCamera();
    if (!granted) return null;

    setIsLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync(PICKER_OPTIONS);
      if (result.canceled || !result.assets[0]) return null;

      const asset = result.assets[0];
      const picked: PickedImage = {
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        fileSize: asset.fileSize,
      };
      setImage(picked);
      return picked;
    } finally {
      setIsLoading(false);
    }
  }, [requestCamera]);

  const pickFromGallery = useCallback(async (): Promise<PickedImage | null> => {
    const granted = await requestMediaLibrary();
    if (!granted) return null;

    setIsLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
      if (result.canceled || !result.assets[0]) return null;

      const asset = result.assets[0];
      const picked: PickedImage = {
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        fileSize: asset.fileSize,
      };
      setImage(picked);
      return picked;
    } finally {
      setIsLoading(false);
    }
  }, [requestMediaLibrary]);

  const clearImage = useCallback(() => setImage(null), []);

  return { image, isLoading, pickFromCamera, pickFromGallery, clearImage };
}