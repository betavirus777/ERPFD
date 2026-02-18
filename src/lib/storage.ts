import { BlobServiceClient, ContainerClient, BlockBlobClient } from '@azure/storage-blob';
import path from 'path';

// Azure Storage Configuration
const AZURE_STORAGE_NAME = process.env.AZURE_STORAGE_NAME;
const AZURE_STORAGE_KEY = process.env.AZURE_STORAGE_KEY;
const AZURE_STORAGE_CONTAINER = process.env.AZURE_STORAGE_CONTAINER || 'uploads';
const AZURE_STORAGE_URL = process.env.AZURE_STORAGE_URL;

// Check if Azure is configured
const isAzureConfigured = (): boolean => {
  return !!(AZURE_STORAGE_NAME && AZURE_STORAGE_KEY);
};

// Get Azure Blob Service Client
const getBlobServiceClient = (): BlobServiceClient | null => {
  if (!isAzureConfigured()) {
    return null;
  }
  
  const connectionString = `DefaultEndpointsProtocol=https;AccountName=${AZURE_STORAGE_NAME};AccountKey=${AZURE_STORAGE_KEY};EndpointSuffix=core.windows.net`;
  return BlobServiceClient.fromConnectionString(connectionString);
};

// Get Container Client
const getContainerClient = (): ContainerClient | null => {
  const blobServiceClient = getBlobServiceClient();
  if (!blobServiceClient) return null;
  return blobServiceClient.getContainerClient(AZURE_STORAGE_CONTAINER);
};

// Generate unique filename
const generateUniqueFileName = (originalName: string): string => {
  const ext = path.extname(originalName);
  const name = path.basename(originalName, ext);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${name}_${timestamp}_${random}${ext}`;
};

// Upload file to Azure Blob Storage
export const uploadToAzure = async (
  file: Buffer,
  originalFileName: string,
  uploadPath: string,
  contentType?: string
): Promise<{ success: boolean; path?: string; url?: string; error?: string }> => {
  try {
    const containerClient = getContainerClient();
    
    if (!containerClient) {
      console.warn('Azure Storage not configured, using local fallback');
      return { success: false, error: 'Azure Storage not configured' };
    }
    
    // Generate unique filename
    const uniqueFileName = generateUniqueFileName(originalFileName);
    const blobName = `${uploadPath}/${uniqueFileName}`;
    
    // Get block blob client
    const blockBlobClient: BlockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    // Upload file
    await blockBlobClient.uploadData(file, {
      blobHTTPHeaders: {
        blobContentType: contentType || 'application/octet-stream',
      },
    });
    
    // Get URL
    let url: string;
    if (AZURE_STORAGE_URL) {
      url = `${AZURE_STORAGE_URL}/${AZURE_STORAGE_CONTAINER}/${blobName}`;
    } else {
      url = blockBlobClient.url;
    }
    
    return {
      success: true,
      path: blobName,
      url,
    };
  } catch (error) {
    console.error('Azure upload error:', error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
};

// Delete file from Azure Blob Storage
export const deleteFromAzure = async (blobPath: string): Promise<boolean> => {
  try {
    const containerClient = getContainerClient();
    
    if (!containerClient) {
      console.warn('Azure Storage not configured');
      return false;
    }
    
    const blockBlobClient = containerClient.getBlockBlobClient(blobPath);
    await blockBlobClient.deleteIfExists();
    
    return true;
  } catch (error) {
    console.error('Azure delete error:', error);
    return false;
  }
};

// Get file URL from Azure
export const getAzureFileUrl = (blobPath: string): string => {
  if (!blobPath) return '';
  
  // If already a full URL, return as-is
  if (blobPath.startsWith('http://') || blobPath.startsWith('https://')) {
    return blobPath;
  }
  
  // Build Azure URL
  if (AZURE_STORAGE_URL) {
    return `${AZURE_STORAGE_URL}/${AZURE_STORAGE_CONTAINER}/${blobPath}`;
  }
  
  if (AZURE_STORAGE_NAME) {
    return `https://${AZURE_STORAGE_NAME}.blob.core.windows.net/${AZURE_STORAGE_CONTAINER}/${blobPath}`;
  }
  
  // Fallback to local path
  return `/uploads/${blobPath}`;
};

// Download file from Azure
export const downloadFromAzure = async (blobPath: string): Promise<Buffer | null> => {
  try {
    const containerClient = getContainerClient();
    
    if (!containerClient) {
      console.warn('Azure Storage not configured');
      return null;
    }
    
    const blockBlobClient = containerClient.getBlockBlobClient(blobPath);
    const downloadResponse = await blockBlobClient.download(0);
    
    if (!downloadResponse.readableStreamBody) {
      return null;
    }
    
    // Convert stream to buffer
    const chunks: Buffer[] = [];
    for await (const chunk of downloadResponse.readableStreamBody) {
      chunks.push(Buffer.from(chunk));
    }
    
    return Buffer.concat(chunks);
  } catch (error) {
    console.error('Azure download error:', error);
    return null;
  }
};

// List files in a path
export const listAzureFiles = async (prefix: string): Promise<string[]> => {
  try {
    const containerClient = getContainerClient();
    
    if (!containerClient) {
      console.warn('Azure Storage not configured');
      return [];
    }
    
    const files: string[] = [];
    
    for await (const blob of containerClient.listBlobsFlat({ prefix })) {
      files.push(blob.name);
    }
    
    return files;
  } catch (error) {
    console.error('Azure list error:', error);
    return [];
  }
};

// Export configuration check
export { isAzureConfigured };

