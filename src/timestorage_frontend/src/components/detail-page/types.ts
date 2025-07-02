export interface FileMetadata {
  fileId: string;
  fileName: string;
  mimeType: string;
  isImage: boolean;
  uploadTimestamp: string;
}

export interface FileCacheItem {
  id: string;
  name: string;
  mimeType: string;
  metadata: FileMetadata;
  content?: string;
  error?: boolean;
}

export interface FileCache {
  [key: string]: FileCacheItem;
}

export interface PageDataItem {
  label: string;
  value: string;
  fileType?: string;
  path?: string;
  icon?: string;
}

export interface FileViewerProps {
  file: {
    id: string;
    name: string;
    mimeType: string;
    content?: string;
    error?: boolean;
  };
  onDownload: (file: FileCacheItem) => Promise<void>;
  isDownloading: boolean;
}

export interface FileUploaderProps {
  label: string;
  fileType: string;
  refId: string;
  isUploading: boolean;
  onUpload: (file: File, refId: string) => Promise<void>;
  inputRef: React.RefObject<HTMLInputElement>;
}

export interface DetailItemProps {
  item: PageDataItem;
  children: React.ReactNode;
  className?: string;
}

export interface ImageGalleryProps {
  fileCache: FileCache;
  onImageClick: (fileId: string) => void;
}
