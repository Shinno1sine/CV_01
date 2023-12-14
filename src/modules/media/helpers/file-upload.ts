import { BadRequestException } from '@nestjs/common';
import { convertTitleToSlug } from '@utils/string.util';
import { isArray } from 'class-validator';
import * as path from 'path';
import * as sharp from 'sharp';

import { v4 as uuidv4 } from 'uuid';
import { IMAGE_RGX } from '../media.interface';

/**
 *
 * @param {any}_req
 * @param {Express.Multer.File}file
 * @param {(error: Error | null, acceptFile: string) => void}cb
 */
export class FileUploadHelper {
  static customFileName(
    _req: any,
    file: Express.Multer.File,
    cb: (error: Error | null, acceptFile: string) => void,
  ) {
    const originalName = file.originalname.split('.')[0];
    const parse = path.parse(file.originalname);
    const uniqueFile = uuidv4();
    cb(null, originalName + '-' + uniqueFile + parse.ext);
  }

  /**
   *
   * @param {any}_req
   * @param {Express.Multer.File}_file
   * @param {(error: Error | null, acceptFile: string) => void}cb
   */
  static destinationPath(
    _req: any,
    _file: Express.Multer.File,
    cb: (error: Error | null, acceptFile: string) => void,
  ) {
    cb(null, './uploads/');
  }

  /**
   *
   * @param {Express.Multer.File}file
   * @param {boolean}isWebp
   * @returns {Promise<{ fileBuffer: Buffer; : string; : string; : string; width: number; height: number; size: number }> }
   */
  static async customFileBeforeUpload(
    file: Express.Multer.File,
    isWebp: boolean,
  ): Promise<{
    fileBuffer: Buffer;
    filename: string;
    originalname: string;
    format: string;
    width: number;
    height: number;
    size: number;
  }> {
    let filename: string,
      fileBuffer: Buffer,
      parse: path.ParsedPath,
      format: string,
      width: number,
      height: number,
      size: number;

    const originalname = file.originalname.split('.')[0];
    const uniqueFile = uuidv4().substring(5, 10);

    if (isWebp && this.isImage(file)) {
      fileBuffer = await sharp(file.buffer).webp().toBuffer();

      parse = path.parse(file.originalname);
      filename = convertTitleToSlug(parse.name) + '-' + uniqueFile + '.webp';
      parse = path.parse(filename);
    } else {
      parse = path.parse(file.originalname);
      filename = `${convertTitleToSlug(originalname)}-${uniqueFile}${
        parse.ext
      }`;
      fileBuffer = file.buffer;
    }

    if (this.isImage(file)) {
      const fileA = await sharp(fileBuffer).toFile('file');
      format = parse.ext;
      height = fileA.height;
      width = fileA.width;
      size = fileA.size;
    } else {
      format = parse.ext;
      height = null;
      width = null;
      size = file.size;
    }

    return {
      fileBuffer,
      filename,
      originalname: file.originalname,
      format,
      width,
      height,
      size,
    };
  }

  /**
   *
   * @param {any}_req
   * @param {Express.Multer.File}file
   * @param {(error: Error | null, acceptFile: boolean) => void}callback
   * @returns
   */
  static fileFilter = (
    _req: any,
    file: Express.Multer.File,
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (
      !file.originalname.match(
        /\.(jpg|jpeg|png|gif|JPG|JPEG|PNG|GIF|mp4|mov|mwv|avi|mkv|flv|webm|mts|mpeg4|MP4|MOV|WMV|AVI|MKV|FLV|WEBM|MTS|MPEG4|csv|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|xml|odt|ods|CSV|PDF|DOC|DOCX|XLS|XLSX|PPT|PPTX|TXT|XML|ODT|ODS|mp3|flac|wav|wma|aac|m4A|M4A|FLAC|MP3|WAV|WMA|AAC)$/,
      )
    ) {
      return callback(
        new BadRequestException({
          message: 'The file is not in the correct format!',
        }),
        false,
      );
    }
    callback(null, true);
  };

  /**
   *
   * @param {any}_req
   * @param {Express.Multer.File}file
   * @param {(error: Error | null, acceptFile: boolean) => void}callback
   * @param {RegExp}regex
   * @param {string}message
   * @returns
   */
  static fileFilterDynamic = (
    _req: any,
    file: Express.Multer.File,
    callback: (error: Error | null, acceptFile: boolean) => void,
    regex: RegExp,
    message?: string,
  ) => {
    if (!file.originalname.match(regex)) {
      return callback(
        new BadRequestException({
          message: message || 'The file is not in the correct format!',
        }),
        false,
      );
    }
    callback(null, true);
  };

  /**
   *
   * @param {Array<Express.Multer.File>}files
   */
  static validationFilesBeforeUpload(files: Array<Express.Multer.File>): void {
    if (!isArray(files) || (isArray(files) && files?.length <= 0))
      throw new BadRequestException({ message: 'File is required!' });
    let isFile = true;
    files.forEach((f) => {
      if (
        !f?.buffer ||
        !f.originalname.match(
          /\.(jpg|jpeg|png|gif|JPG|JPEG|PNG|GIF|mp4|mov|mwv|avi|mkv|flv|webm|mts|mpeg4|MP4|MOV|WMV|AVI|MKV|FLV|WEBM|MTS|MPEG4|csv|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|xml|odt|ods|CSV|PDF|DOC|DOCX|XLS|XLSX|PPT|PPTX|TXT|XML|ODT|ODS|mp3|flac|wav|wma|aac|m4A|M4A|FLAC|MP3|WAV|WMA|AAC)$/,
        )
      ) {
        isFile = false;
        return;
      }
    });
    if (!isFile)
      throw new BadRequestException({
        message: 'The file is not in the correct format!',
      });
  }

  /**
   *
   * @param {Express.Multer.File}file
   */
  static validationFileBeforeUpload(file: Express.Multer.File): void {
    if (!file) throw new BadRequestException({ message: 'File is required!' });
    if (
      !file?.buffer ||
      !file.originalname.match(
        /\.(jpg|jpeg|png|gif|JPG|JPEG|PNG|GIF|mp4|mov|mwv|avi|mkv|flv|webm|mts|mpeg4|MP4|MOV|WMV|AVI|MKV|FLV|WEBM|MTS|MPEG4|csv|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|xml|odt|ods|CSV|PDF|DOC|DOCX|XLS|XLSX|PPT|PPTX|TXT|XML|ODT|ODS|mp3|flac|wav|wma|aac|m4A|M4A|FLAC|MP3|WAV|WMA|AAC)$/,
      )
    )
      throw new BadRequestException({
        message: 'The file is not in the correct format!',
      });
  }

  /**
   *
   * @param {Express.Multer.File}file
   * @returns {boolean}
   */
  static isImage(file: Express.Multer.File): boolean {
    return !!file.originalname.match(IMAGE_RGX);
  }
}
