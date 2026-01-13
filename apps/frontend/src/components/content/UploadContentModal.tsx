/**
 * UploadContentModal Component
 * Modal for uploading video and image content with drag & drop
 * Or adding content from URL (YouTube, Vimeo, direct links)
 */

'use client';

import * as React from 'react';
import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useHotels } from '@/hooks/useHotels';
import { useAuth } from '@/contexts/AuthContext';
import { uploadContent } from '@/lib/api/content';
import { authenticatedFetch } from '@/lib/api/auth';
import { Upload, X, FileVideo, Image as ImageIcon, CheckCircle2, AlertCircle, Link as LinkIcon, Youtube, Globe } from 'lucide-react';
import Image from 'next/image';
import type { ContentType } from '@/lib/api/content';

/**
 * Source types for content
 */
type ContentSource = 'FILE' | 'YOUTUBE' | 'VIMEO' | 'URL';
type TabType = 'file' | 'url';

/**
 * Accepted file types
 */
const ACCEPTED_VIDEO_TYPES = {
  'video/mp4': ['.mp4'],
  'video/webm': ['.webm'],
  'video/quicktime': ['.mov'],
  'video/x-msvideo': ['.avi'],
};

const ACCEPTED_IMAGE_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
};

const ACCEPTED_FILE_TYPES = {
  ...ACCEPTED_VIDEO_TYPES,
  ...ACCEPTED_IMAGE_TYPES,
};

/**
 * Max file sizes
 */
const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500 MB
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB

/**
 * Upload states
 */
type UploadState = 'idle' | 'uploading' | 'success' | 'error';

/**
 * Validation schema for file upload
 */
const uploadSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  file: z.instanceof(File),
});

/**
 * Validation schema for URL content
 */
const urlSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  url: z.string().url('Please enter a valid URL'),
});

/**
 * Detect content source from URL
 */
function detectSourceFromUrl(url: string): { source: ContentSource; type: ContentType } {
  const lowerUrl = url.toLowerCase();

  // YouTube detection
  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
    return { source: 'YOUTUBE', type: 'VIDEO' };
  }

  // Vimeo detection
  if (lowerUrl.includes('vimeo.com')) {
    return { source: 'VIMEO', type: 'VIDEO' };
  }

  // Direct file detection by extension
  const videoExtensions = ['.mp4', '.webm', '.mov', '.avi'];
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

  if (videoExtensions.some(ext => lowerUrl.includes(ext))) {
    return { source: 'URL', type: 'VIDEO' };
  }

  if (imageExtensions.some(ext => lowerUrl.includes(ext))) {
    return { source: 'URL', type: 'IMAGE' };
  }

  // Default to URL video
  return { source: 'URL', type: 'VIDEO' };
}

/**
 * Extract YouTube video ID
 */
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/,
    /youtube\.com\/embed\/([^&?/]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

/**
 * Get thumbnail URL for external content
 */
function getThumbnailUrl(url: string, source: ContentSource): string | null {
  if (source === 'YOUTUBE') {
    const videoId = extractYouTubeId(url);
    if (videoId) return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
  }
  // For direct URLs, use the URL itself if it's an image
  if (source === 'URL' && /\.(jpg|jpeg|png|gif|webp)/i.test(url)) {
    return url;
  }
  return null;
}

interface UploadContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * Get content type from MIME type
 */
function getContentTypeFromMime(mimetype: string): ContentType | null {
  if (mimetype.startsWith('video/')) return 'VIDEO';
  if (mimetype.startsWith('image/')) return 'IMAGE';
  return null;
}

/**
 * Format file size to human readable
 */
function formatFileSize(bytes: number): string {
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Validate file size based on type
 */
function validateFileSize(file: File): string | null {
  const contentType = getContentTypeFromMime(file.type);

  if (contentType === 'VIDEO' && file.size > MAX_VIDEO_SIZE) {
    return `Video files must be smaller than ${formatFileSize(MAX_VIDEO_SIZE)}`;
  }

  if (contentType === 'IMAGE' && file.size > MAX_IMAGE_SIZE) {
    return `Image files must be smaller than ${formatFileSize(MAX_IMAGE_SIZE)}`;
  }

  return null;
}

export function UploadContentModal({
  isOpen,
  onClose,
  onSuccess,
}: UploadContentModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();

  // Tab state
  const [activeTab, setActiveTab] = React.useState<TabType>('file');

  // Form state - File upload
  const [name, setName] = React.useState('');
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  // Form state - URL
  const [contentUrl, setContentUrl] = React.useState('');
  const [detectedSource, setDetectedSource] = React.useState<ContentSource | null>(null);
  const [detectedType, setDetectedType] = React.useState<ContentType | null>(null);
  const [urlThumbnail, setUrlThumbnail] = React.useState<string | null>(null);
  const [urlError, setUrlError] = React.useState<string | null>(null);

  // Upload state
  const [uploadState, setUploadState] = React.useState<UploadState>('idle');
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [nameError, setNameError] = React.useState<string | null>(null);

  // Hotel selection state (for Super Admin)
  const [selectedHotelId, setSelectedHotelId] = React.useState<string>('');

  // Fetch hotels using the existing hook (for Super Admin)
  const { data: hotels = [], isLoading: hotelsLoading } = useHotels();

  // Effective hotelId: user's hotel OR selected hotel for Super Admin
  const effectiveHotelId = user?.hotelId || selectedHotelId;

  /**
   * Reset form when modal closes
   */
  React.useEffect(() => {
    if (!isOpen) {
      setName('');
      setSelectedFile(null);
      setPreviewUrl(null);
      setUploadState('idle');
      setUploadProgress(0);
      setErrorMessage(null);
      setNameError(null);
      setSelectedHotelId('');
      // Reset URL state
      setActiveTab('file');
      setContentUrl('');
      setDetectedSource(null);
      setDetectedType(null);
      setUrlThumbnail(null);
      setUrlError(null);
    }
  }, [isOpen]);

  /**
   * Pre-select first hotel for Super Admin when hotels load
   */
  React.useEffect(() => {
    const firstHotel = hotels[0];
    if (user?.role === 'SUPER_ADMIN' && !user?.hotelId && firstHotel && !selectedHotelId) {
      setSelectedHotelId(firstHotel.id);
    }
  }, [hotels, user, selectedHotelId]);

  /**
   * Create preview URL for images
   */
  React.useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }

    // Only create preview for images
    if (selectedFile.type.startsWith('image/')) {
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreviewUrl(objectUrl);

      // Cleanup
      return () => URL.revokeObjectURL(objectUrl);
    }
  }, [selectedFile]);

  /**
   * Handle file drop
   */
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    if (!file) return;

    // Validate file size
    const sizeError = validateFileSize(file);
    if (sizeError) {
      setErrorMessage(sizeError);
      toast({
        title: 'Invalid file',
        description: sizeError,
        variant: 'destructive',
      });
      return;
    }

    setSelectedFile(file);
    setErrorMessage(null);

    // Auto-fill name if empty
    if (!name) {
      const fileName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
      setName(fileName);
    }
  }, [name, toast]);

  /**
   * Handle file rejection
   */
  const onDropRejected = useCallback(() => {
    const errorMsg = 'Invalid file type. Please upload a video (MP4, WebM, MOV, AVI) or image (JPG, PNG, GIF, WebP).';
    setErrorMessage(errorMsg);
    toast({
      title: 'Invalid file type',
      description: errorMsg,
      variant: 'destructive',
    });
  }, [toast]);

  /**
   * Setup dropzone
   */
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: ACCEPTED_FILE_TYPES,
    maxFiles: 1,
    multiple: false,
  });

  /**
   * Remove selected file
   */
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setErrorMessage(null);
  };

  /**
   * Handle URL input change - detect source type and thumbnail
   */
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setContentUrl(url);
    setUrlError(null);

    if (!url.trim()) {
      setDetectedSource(null);
      setDetectedType(null);
      setUrlThumbnail(null);
      return;
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      setDetectedSource(null);
      setDetectedType(null);
      setUrlThumbnail(null);
      return;
    }

    // Detect source and type
    const { source, type } = detectSourceFromUrl(url);
    setDetectedSource(source);
    setDetectedType(type);

    // Get thumbnail
    const thumbnail = getThumbnailUrl(url, source);
    setUrlThumbnail(thumbnail);
  };

  /**
   * Handle URL form submission
   */
  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!contentUrl.trim()) {
      setUrlError('URL is required');
      return;
    }

    try {
      urlSchema.parse({ name, url: contentUrl });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const urlErr = error.issues.find((issue) => issue.path[0] === 'url');
        const nameErr = error.issues.find((issue) => issue.path[0] === 'name');
        if (urlErr) setUrlError(urlErr.message);
        if (nameErr) setNameError(nameErr.message);
        return;
      }
    }

    if (!effectiveHotelId) {
      toast({
        title: 'Hotel required',
        description: 'Please select a hotel',
        variant: 'destructive',
      });
      return;
    }

    setUploadState('uploading');
    setUploadProgress(50); // Simulate progress for URL content

    try {
      // Create content via API with URL
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await authenticatedFetch(`${API_URL}/api/content/url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          url: contentUrl,
          source: detectedSource,
          type: detectedType,
          thumbnailUrl: urlThumbnail,
          hotelId: effectiveHotelId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to add content');
      }

      setUploadProgress(100);
      setUploadState('success');
      onSuccess?.();
    } catch (error) {
      setUploadState('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to add content');
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setNameError(null);

    // Validate
    if (!selectedFile) {
      setErrorMessage('Please select a file to upload');
      return;
    }

    const result = uploadSchema.safeParse({ name, file: selectedFile });

    if (!result.success) {
      const error = result.error.issues[0];
      if (error && error.path[0] === 'name') {
        setNameError(error.message);
      }
      return;
    }

    // Validate hotelId (either from user's hotel or selected hotel for Super Admin)
    if (!effectiveHotelId) {
      const errorMsg = user?.role === 'SUPER_ADMIN'
        ? 'Please select a hotel to upload content.'
        : 'No hotel assigned to your account. Please contact an administrator.';
      setErrorMessage(errorMsg);
      toast({
        title: 'Upload failed',
        description: errorMsg,
        variant: 'destructive',
      });
      return;
    }

    // Start upload
    setUploadState('uploading');
    setUploadProgress(10);

    try {
      // Simulate progress (since we don't have real progress from fetch)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Upload file using effectiveHotelId (user's hotel or selected hotel)
      const content = await uploadContent(
        selectedFile,
        name,
        effectiveHotelId
      );

      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadState('success');

      console.log('✅ Content uploaded successfully:', content);

      toast({
        title: 'Upload successful',
        description: `${name} has been uploaded successfully.`,
      });

      // Wait a bit to show success state, then close
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1000);
    } catch (error: unknown) {
      console.error('❌ Error uploading content:', error);

      const errorMsg =
        error instanceof Error ? error.message : 'Failed to upload content';

      setUploadState('error');
      setErrorMessage(errorMsg);

      toast({
        title: 'Upload failed',
        description: errorMsg,
        variant: 'destructive',
      });
    }
  };

  /**
   * Get file type icon and color
   */
  const getFileTypeInfo = () => {
    if (!selectedFile) return null;

    const contentType = getContentTypeFromMime(selectedFile.type);

    if (contentType === 'VIDEO') {
      return {
        icon: FileVideo,
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
      };
    }

    if (contentType === 'IMAGE') {
      return {
        icon: ImageIcon,
        color: 'text-purple-500',
        bgColor: 'bg-purple-500/10',
      };
    }

    return null;
  };

  const fileTypeInfo = getFileTypeInfo();
  const isUploading = uploadState === 'uploading';
  const isSuccess = uploadState === 'success';
  const isError = uploadState === 'error';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add Content</DialogTitle>
          <DialogDescription>
            Upload a file or add content from a URL (YouTube, Vimeo, or direct link).
          </DialogDescription>
        </DialogHeader>

        {/* Tabs for source selection */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="file" disabled={isUploading}>
              <Upload className="h-4 w-4 mr-2" />
              Upload File
            </TabsTrigger>
            <TabsTrigger value="url" disabled={isUploading}>
              <LinkIcon className="h-4 w-4 mr-2" />
              From URL
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <form onSubmit={activeTab === 'file' ? handleSubmit : handleUrlSubmit}>
          <div className="grid gap-6 py-4">

            {/* FILE TAB CONTENT */}
            {activeTab === 'file' && (
              <>
                {/* File Drop Zone */}
                {!selectedFile && uploadState === 'idle' && (
                  <div
                    {...getRootProps()}
                    className={`
                      cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors
                      ${isDragActive
                        ? 'border-primary bg-primary/5'
                        : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
                      }
                    `}
                  >
                    <input {...getInputProps()} />
                    <Upload className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                    <p className="mb-2 text-sm font-medium">
                      {isDragActive
                        ? 'Drop your file here'
                        : 'Drag & drop a file here, or click to select'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Supported: Videos (MP4, WebM, MOV, AVI) up to 500MB
                      <br />
                      Images (JPG, PNG, GIF, WebP) up to 10MB
                    </p>
                  </div>
                )}

                {/* File Preview */}
                {selectedFile && uploadState === 'idle' && (
                  <div className="rounded-lg border border-border p-4">
                    <div className="flex items-start gap-4">
                      {/* Thumbnail/Icon */}
                      <div className="flex-shrink-0">
                        {previewUrl ? (
                          <div className="relative h-20 w-20 overflow-hidden rounded-md">
                            <Image
                              src={previewUrl}
                              alt="Preview"
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : fileTypeInfo ? (
                          <div className={`flex h-20 w-20 items-center justify-center rounded-md ${fileTypeInfo.bgColor}`}>
                            <fileTypeInfo.icon className={`h-10 w-10 ${fileTypeInfo.color}`} />
                          </div>
                        ) : null}
                      </div>

                      {/* File Info */}
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <p className="font-medium truncate max-w-full" title={selectedFile.name}>
                          {selectedFile.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(selectedFile.size)}
                          {' • '}
                          {getContentTypeFromMime(selectedFile.type)}
                        </p>
                      </div>

                      {/* Remove Button */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveFile}
                        disabled={isUploading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Name Input */}
                {selectedFile && uploadState === 'idle' && (
                  <div className="grid gap-2">
                    <Label htmlFor="name">
                      Content Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (nameError) setNameError(null);
                      }}
                      placeholder="e.g. Hotel Welcome Video"
                      disabled={isUploading}
                      className={nameError ? 'border-destructive' : ''}
                    />
                    {nameError && (
                      <p className="text-sm text-destructive">{nameError}</p>
                    )}
                  </div>
                )}

                {/* Hotel Selector for Super Admin */}
                {selectedFile && uploadState === 'idle' && user?.role === 'SUPER_ADMIN' && !user?.hotelId && (
                  <div className="grid gap-2">
                    <Label htmlFor="hotel">
                      Target Hotel <span className="text-destructive">*</span>
                    </Label>
                    {hotelsLoading ? (
                      <p className="text-sm text-muted-foreground">Loading hotels...</p>
                    ) : hotels.length === 0 ? (
                      <p className="text-sm text-destructive">No hotels available</p>
                    ) : (
                      <Select value={selectedHotelId} onValueChange={setSelectedHotelId}>
                        <SelectTrigger id="hotel" className="w-full">
                          <SelectValue placeholder="Select hotel for this content" />
                        </SelectTrigger>
                        <SelectContent
                          position="popper"
                          sideOffset={4}
                          align="start"
                          className="w-[--radix-select-trigger-width] max-h-60"
                        >
                          {hotels.map((hotel) => (
                            <SelectItem key={hotel.id} value={hotel.id}>
                              {hotel.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}

                {/* Upload Progress */}
                {isUploading && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      {fileTypeInfo && (
                        <div className={`flex h-12 w-12 items-center justify-center rounded-md ${fileTypeInfo.bgColor}`}>
                          <fileTypeInfo.icon className={`h-6 w-6 ${fileTypeInfo.color}`} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{name}</p>
                        <p className="text-sm text-muted-foreground">Uploading...</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Progress value={uploadProgress} className="h-2" />
                      <p className="text-xs text-muted-foreground text-center">
                        {uploadProgress}% complete
                      </p>
                    </div>
                  </div>
                )}

                {/* Success State */}
                {isSuccess && (
                  <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-6 text-center">
                    <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-green-500" />
                    <p className="font-medium text-green-600">Upload successful!</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {name} has been added to your content library
                    </p>
                  </div>
                )}

                {/* Error Message */}
                {errorMessage && uploadState === 'idle' && (
                  <div className="rounded-md bg-destructive/10 p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-destructive">{errorMessage}</p>
                    </div>
                  </div>
                )}

                {/* Error State */}
                {isError && errorMessage && (
                  <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-6 text-center">
                    <AlertCircle className="mx-auto mb-3 h-12 w-12 text-red-500" />
                    <p className="font-medium text-red-600">Upload failed</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {errorMessage}
                    </p>
                  </div>
                )}
              </>
            )}

            {/* URL TAB CONTENT */}
            {activeTab === 'url' && uploadState === 'idle' && (
              <>
                {/* URL Input */}
                <div className="grid gap-2">
                  <Label htmlFor="content-url">
                    Content URL <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="content-url"
                    type="url"
                    value={contentUrl}
                    onChange={handleUrlChange}
                    placeholder="https://youtube.com/watch?v=... or https://example.com/video.mp4"
                    className={urlError ? 'border-destructive' : ''}
                  />
                  {urlError && (
                    <p className="text-sm text-destructive">{urlError}</p>
                  )}
                </div>

                {/* URL Preview */}
                {detectedSource && (
                  <div className="rounded-lg border border-border p-4">
                    <div className="flex items-center gap-4">
                      {/* Source Icon */}
                      <div className="flex-shrink-0">
                        {urlThumbnail ? (
                          <div className="relative h-20 w-32 overflow-hidden rounded-md bg-muted">
                            <Image
                              src={urlThumbnail}
                              alt="Preview"
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <div className={`flex h-20 w-20 items-center justify-center rounded-md ${detectedSource === 'YOUTUBE' ? 'bg-red-500/10' : 'bg-blue-500/10'}`}>
                            {detectedSource === 'YOUTUBE' ? (
                              <Youtube className="h-10 w-10 text-red-500" />
                            ) : (
                              <Globe className="h-10 w-10 text-blue-500" />
                            )}
                          </div>
                        )}
                      </div>

                      {/* Source Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium capitalize">{detectedSource.toLowerCase()} {detectedType?.toLowerCase()}</p>
                        <p className="text-sm text-muted-foreground truncate">{contentUrl}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Name Input for URL */}
                {detectedSource && (
                  <div className="grid gap-2">
                    <Label htmlFor="url-name">
                      Content Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="url-name"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (nameError) setNameError(null);
                      }}
                      placeholder="e.g. Hotel Promo Video"
                      className={nameError ? 'border-destructive' : ''}
                    />
                    {nameError && (
                      <p className="text-sm text-destructive">{nameError}</p>
                    )}
                  </div>
                )}

                {/* Hotel Selector for URL - Super Admin */}
                {detectedSource && user?.role === 'SUPER_ADMIN' && !user?.hotelId && (
                  <div className="grid gap-2">
                    <Label htmlFor="url-hotel">
                      Target Hotel <span className="text-destructive">*</span>
                    </Label>
                    {hotelsLoading ? (
                      <p className="text-sm text-muted-foreground">Loading hotels...</p>
                    ) : hotels.length === 0 ? (
                      <p className="text-sm text-destructive">No hotels available</p>
                    ) : (
                      <Select value={selectedHotelId} onValueChange={setSelectedHotelId}>
                        <SelectTrigger id="url-hotel">
                          <SelectValue placeholder="Select hotel" />
                        </SelectTrigger>
                        <SelectContent>
                          {hotels.map((hotel) => (
                            <SelectItem key={hotel.id} value={hotel.id}>
                              {hotel.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Success/Error States - shared */}
            {isSuccess && (
              <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-6 text-center">
                <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-green-500" />
                <p className="font-medium text-green-600">Content added successfully!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {name} has been added to your content library
                </p>
              </div>
            )}

            {isError && errorMessage && (
              <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-6 text-center">
                <AlertCircle className="mx-auto mb-3 h-12 w-12 text-red-500" />
                <p className="font-medium text-red-600">Failed to add content</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {errorMessage}
                </p>
              </div>
            )}

          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isUploading}
            >
              {isSuccess ? 'Close' : 'Cancel'}
            </Button>
            {!isSuccess && !isError && (
              <Button
                type="submit"
                disabled={
                  activeTab === 'file'
                    ? !selectedFile || isUploading || !effectiveHotelId
                    : !contentUrl || !detectedSource || !name || isUploading || !effectiveHotelId
                }
              >
                {isUploading ? 'Adding...' : activeTab === 'file' ? 'Upload' : 'Add Content'}
              </Button>
            )}
            {isError && (
              <Button
                type="button"
                onClick={() => {
                  setUploadState('idle');
                  setUploadProgress(0);
                  setErrorMessage(null);
                }}
              >
                Try Again
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
