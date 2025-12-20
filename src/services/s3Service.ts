// src/services/s3Service.ts
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from './api';

/**
 * Store image locally (for development mode)
 * @param imageUri - Local file URI from image picker
 * @param userId - User ID to associate with the image
 * @returns Promise with local storage path
 */
export const storeImageLocally = async (
  imageUri: string,
  userId: string
): Promise<string> => {
  try {
    // For development, just return the imageUri as-is
    // The image will be stored in the database as the local path
    // Store reference in AsyncStorage
    await AsyncStorage.setItem(`profileImage_${userId}`, imageUri);
    return imageUri;
  } catch (error) {
    console.error('Error storing image locally:', error);
    throw new Error('Failed to store image locally');
  }
};

/**
 * Get stored local image path
 * @param userId - User ID
 * @returns Promise with local image path or null
 */
export const getLocalImagePath = async (userId: string): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(`profileImage_${userId}`);
  } catch (error) {
    console.error('Error getting local image path:', error);
    return null;
  }
};

/**
 * Upload image to S3 via backend API
 * @param imageUri - Local file URI from image picker
 * @param folder - Folder path in S3 bucket (e.g., 'profiles', 'uploads')
 * @returns Promise with S3 key (stored in database, backend generates signed URLs when needed)
 */
export const uploadImageToS3 = async (
  imageUri: string,
  folder: string = 'profiles'
): Promise<string> => {
  try {
    // Get file info
    const fileInfo = await FileSystem.getInfoAsync(imageUri);
    if (!fileInfo.exists) {
      throw new Error('Image file does not exist');
    }

    // Get file extension
    const extension = imageUri.split('.').pop() || 'jpg';
    const fileName = `profile-${Date.now()}.${extension}`;

    // Create FormData
    const formData = new FormData();
    
    // For React Native, we need to create a file object
    // The imageUri is a local file path, we'll send it as a file
    formData.append('image', {
      uri: imageUri,
      type: `image/${extension === 'png' ? 'png' : 'jpeg'}`,
      name: fileName,
    } as any);
    
    formData.append('folder', folder);
    formData.append('fileName', fileName);

    // Send to backend for S3 upload
    const response = await apiService.uploadImageToS3(formData);

    if (response.success && response.data) {
      // Store the S3 key (not the signed URL) for future signed URL generation
      // The backend will generate signed URLs when fetching the profile
      return response.data.key || response.data.url;
    } else {
      throw new Error(response.message || 'Failed to upload image');
    }
  } catch (error) {
    console.error('Error uploading image to S3:', error);
    throw new Error('Failed to upload image to S3');
  }
};

/**
 * Main function to upload profile image
 * Uses S3 in production, local storage in development
 * @param imageUri - Local file URI from image picker
 * @param userId - User ID
 * @param folder - S3 folder (default: 'profiles')
 * @returns Promise with image URL or local path
 */
export const uploadProfileImage = async (
  imageUri: string,
  userId: string,
  folder: string = 'profiles'
): Promise<string> => {
  const isDevelopment = process.env.NODE_ENV === 'development' || 
                        process.env.EXPO_PUBLIC_ENV === 'development';

  if (isDevelopment) {
    // Store locally in development
    return await storeImageLocally(imageUri, userId);
  } else {
    // Upload to S3 via backend in production
    return await uploadImageToS3(imageUri, folder);
  }
};

