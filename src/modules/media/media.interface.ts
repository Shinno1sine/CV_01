import { TFolderDocument } from './entities/folder.entity';

export enum EMediaFile {
  IMAGE = 'image',
  DOCUMENT = 'document',
  VIDEO = 'video',
  AUDIO = 'audio',
}

export enum EMediaSystem {
  S3 = 's3',
  SERVER = 'server',
}

export interface ParticleStoredFile {
  mimetype: string;
  encoding: string;
  originalName: string;
}

export const IMAGE_RGX = /\.(jpg|jpeg|png|gif|JPG|JPEG|PNG|GIF)$/;
export const VIDEO_RGX =
  /\.(mp4|mov|mwv|avi|mkv|flv|webm|mts|mpeg4|MP4|MOV|WMV|AVI|MKV|FLV|WEBM|MTS|MPEG4)$/;
export const DOCUMENT_RGX =
  /\.(csv|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|xml|odt|ods|CSV|PDF|DOC|DOCX|XLS|XLSX|PPT|PPTX|TXT|XML|ODT|ODS)$/;
export const AUDIO_RGX =
  /\.(mp3|flac|wav|wma|aac|m4A|M4A|FLAC|MP3|WAV|WMA|AAC)$/;

export type FolderMakeTree = TFolderDocument & {
  children: any[];
};
