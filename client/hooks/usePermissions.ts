import { useState, useCallback } from 'react';
import { Alert, Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

interface PermissionStatus {
  camera: boolean | null;     // null = not yet asked
  mediaLibrary: boolean | null;
}

interface UsePermissionsReturn {
  status: PermissionStatus;
  requestCamera: () => Promise<boolean>;
  requestMediaLibrary: () => Promise<boolean>;
  openSettings: () => void;
}

export function usePermissions(): UsePermissionsReturn {
  const [status, setStatus] = useState<PermissionStatus>({
    camera: null,
    mediaLibrary: null,
  });

  const requestCamera = useCallback(async (): Promise<boolean> => {
    const { status: s } = await ImagePicker.requestCameraPermissionsAsync();
    const granted = s === 'granted';

    setStatus((prev) => ({ ...prev, camera: granted }));

    if (!granted) {
      Alert.alert(
        'Camera Access Required',
        'IngredientIQ needs camera access to scan supplement labels.',
        [
          { text: 'Not Now', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
    }

    return granted;
  }, []);

  const requestMediaLibrary = useCallback(async (): Promise<boolean> => {
    const { status: s } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    const granted = s === 'granted';

    setStatus((prev) => ({ ...prev, mediaLibrary: granted }));

    if (!granted) {
      Alert.alert(
        'Photos Access Required',
        'IngredientIQ needs access to your photo library to scan saved images.',
        [
          { text: 'Not Now', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
    }

    return granted;
  }, []);

  const openSettings = useCallback(() => {
    Linking.openSettings();
  }, []);

  return { status, requestCamera, requestMediaLibrary, openSettings };
}