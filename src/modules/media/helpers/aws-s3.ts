import { Logger } from '@nestjs/common';
import * as AwsS3 from 'aws-sdk/clients/s3';
import { ManagedUpload } from 'aws-sdk/lib/s3/managed_upload';
import { Readable } from 'stream';
import { File } from '../entities/file.entity';

export type S3DeleteMedia = AwsS3.ObjectIdentifierList;

export type S3Media = ManagedUpload.SendData;

export class AwsS3Helper {
  static getS3() {
    return new AwsS3({
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
      s3ForcePathStyle: true,
      s3BucketEndpoint: true,
      endpoint: process.env.AWS_ENDPOINT,
    });
  }

  static async uploadS3(
    file: string | Readable | Buffer | Uint8Array | Blob,
    name: string,
  ): Promise<S3Media> {
    const s3 = this.getS3();
    return new Promise((resolve, reject) => {
      s3.upload(
        {
          Bucket: `${process.env.AWS_BUCKET}`,
          Key: String(name),
          Body: file,
          ACL: 'public-read-write',
        },
        (err: Error, data: AwsS3.ManagedUpload.SendData) => {
          if (err) {
            Logger.error('🚀 ~ error', err);
            reject(err.message);
          }
          resolve(data);
        },
      );
    });
  }

  static async deleteS3(file: File) {
    const s3 = this.getS3();
    return await new Promise((resolve, reject) => {
      s3.deleteObject(
        {
          Bucket: file.bucket,
          Key: file.key,
        },
        (err: Error, data: AwsS3.DeleteObjectOutput) => {
          if (err) {
            Logger.error(err);
            reject(err.message);
          }
          resolve(data);
        },
      );
    });
  }

  static async deleteManyS3(files: File[]) {
    return await Promise.all(
      files.map(async (file) => {
        await this.deleteS3(file);
      }),
    );
  }
}
