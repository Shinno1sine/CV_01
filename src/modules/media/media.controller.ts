import {
  Controller,
  HttpException,
  Logger,
  HttpCode,
  HttpStatus,
  Body,
  Post,
  BadRequestException,
  Get,
  Query,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFiles,
  NotFoundException,
  Put,
} from '@nestjs/common';
import { MediaService } from './media.service';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Auth, AuthUser } from '@modules/auth/auth.decorator';
import { CreateFolderDto } from './dto/create-media.dto';
import { ACCESS } from '@configs/permission.config';
import { TUserDocument } from '@modules/user/entities/user.entity';
import { IRes, IResListData } from '@configs/interface.config';
import { TFolderDocument } from './entities/folder.entity';
import {
  QueryFileDto,
  QueryFolderDto,
  QueryMakeTreeFolderDto,
} from './dto/query-media.dto';
import {
  MoveFileDto,
  MoveFolderDto,
  ResizeImageDto,
  UpdateFileDto,
  UpdateFolderDto,
} from './dto/update-media.dto';
import { MongoIdParam } from 'src/validations/mongoId-param.pipe';
import {
  FileUploadMultiDto,
  FileUploadMultiInsertDbDto,
} from './dto/upload-media.dto';
import { FileUploadHelper } from '@modules/media/helpers/file-upload';
import { EMediaSystem } from './media.interface';
import { EnumSystemMediaPipe } from 'src/validations/enum-system-media.pipe';
import { RemoveManyDto } from 'src/base/dto/remove-many.dto';
import { FastifyFilesInterceptor } from './interceptors/fastify-files.interceptor';
import { FOLDER_ROOT_ID } from './seed/folder.seed';

@ApiTags('media')
@Controller('v1/media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  // [START] - Folder Controller
  @Post('folder')
  @Auth(ACCESS.CREATE_MEDIA)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Create folder' })
  async createFolder(
    @Body() body: CreateFolderDto,
    @AuthUser() user: TUserDocument,
  ): Promise<IRes<TFolderDocument>> {
    try {
      const data = await this.mediaService.createFolder(body, user);
      if (!data?._id)
        throw new BadRequestException({ message: 'Create Folder Failed!' });
      return { message: 'Create Folder Success!', data };
    } catch (error) {
      Logger.error('🚀 ~ MediaController ~ createFolder ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Get('folder')
  @Auth(ACCESS.LIST_MEDIAS)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Get list folder' })
  async findAllFolder(
    @Query() query: QueryFolderDto,
  ): Promise<IResListData<TFolderDocument[]>> {
    try {
      const { data, total } = await this.mediaService.findAllFolder(query);
      return {
        message: 'Get List Folder Success!',
        data: data,
        total,
        page: +query.page,
        limit: +query.limit,
      };
    } catch (error) {
      Logger.error('🚀 ~ MediaController ~ createFolder ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Get('folder/make/tree')
  @Auth(ACCESS.LIST_MEDIAS)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Get list folder, make tree' })
  async findAllFolderMakeTree(
    @Query() query: QueryMakeTreeFolderDto,
  ): Promise<IRes<TFolderDocument & { children: any }>> {
    try {
      const { folderId } = query;
      const data = await this.mediaService.findAllFolderMakeTree(folderId);
      return { message: 'Generator tree folder success!', data };
    } catch (error) {
      Logger.error('🚀 ~ MediaController ~ findAllFolderToTree ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Get('folder/:id')
  @Auth(ACCESS.VIEW_MEDIA)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Get detail folder' })
  async findOneFolder(
    @Param('id', new MongoIdParam([FOLDER_ROOT_ID])) id: string,
  ): Promise<IRes<TFolderDocument>> {
    try {
      const data = await this.mediaService.findOneFolder(id);
      if (!data) throw new NotFoundException({ message: 'Folder not found!' });
      const path = await this.mediaService.getPathToNode(data);
      return { message: 'Get Detail Folder Success!', data, path };
    } catch (error) {
      Logger.error('🚀 ~ MediaController ~ findOneFolder ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Patch('folder/:id')
  @Auth(ACCESS.UPDATE_MEDIA)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Update folder by id' })
  async updateFolder(
    @Param('id', new MongoIdParam([FOLDER_ROOT_ID])) id: string,
    @AuthUser() user: TUserDocument,
    @Body() body: UpdateFolderDto,
  ): Promise<IRes> {
    try {
      const result = await this.mediaService.updateFolder(id, body, user);
      if (!result) return { message: 'Update Folder Failed!' };
      return { message: 'Update Folder Success!' };
    } catch (error) {
      Logger.error('🚀 ~ MediaController ~ updateFolder ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Delete('folder/:id')
  @Auth(ACCESS.DELETE_MEDIA)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Delete folder by id' })
  async deleteFolder(
    @Param('id', new MongoIdParam([FOLDER_ROOT_ID])) id: string,
  ): Promise<IRes> {
    try {
      const result = await this.mediaService.removeFolder(id);
      if (!result) return { message: 'Delete Folder Failed!' };
      return { message: 'Delete Folder Success!' };
    } catch (error) {
      Logger.error('🚀 ~ MediaController ~ deleteFolder ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Patch('folder/move/:id')
  @Auth(ACCESS.UPDATE_MEDIA)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Move folder by id' })
  async moveFolder(
    @Param('id', new MongoIdParam([FOLDER_ROOT_ID])) id: string,
    @AuthUser() user: TUserDocument,
    @Body() body: MoveFolderDto,
  ): Promise<IRes> {
    try {
      const result = await this.mediaService.moveFolder(
        id,
        user,
        body.newParentId,
      );
      if (!result)
        throw new BadRequestException({ message: 'Moving Folder Failed!' });
      return { message: 'Moving Folder Success!' };
    } catch (error) {
      Logger.error('🚀 ~ MediaController ~ moveFolder ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }
  // [END] - Folder Controller

  // [START] - File Controller
  @Post('file/:system/upload')
  @Auth(ACCESS.CREATE_MEDIA)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '[ADMIN] Create/Upload File by system, Insert file DB',
  })
  @UseInterceptors(
    FastifyFilesInterceptor('file', 30, {
      limits: { fileSize: 1024 * 1024 * 15 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  async createFile(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Param('system', EnumSystemMediaPipe) system: EMediaSystem,
    @AuthUser() user: TUserDocument,
    @Body() body: FileUploadMultiInsertDbDto,
  ) {
    try {
      if (system === EMediaSystem.S3) {
        const data = await this.mediaService.filesUploadInsertMediaS3(
          files,
          user,
          !!body.isWebp,
          body?.folderId,
        );
        if (Array.isArray(data) && data?.length <= 0) {
          throw new BadRequestException({
            message: 'Upload file failed (S3)!',
          });
        }
        return { message: 'Upload file success (S3)!', data };
      }
      if (system === EMediaSystem.SERVER) return { message: 'Coming soon!' };
      return { message: 'Upload file failed!' };
    } catch (error) {
      Logger.error('🚀 ~ MediaController ~ createFile ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Post('file/:system/upload/client')
  @Auth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      '[USER] Create/Upload File by system not init folder, Insert file DB',
  })
  @UseInterceptors(
    FastifyFilesInterceptor('file', 30, {
      limits: { fileSize: 1024 * 1024 * 15 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  async clientCreateFile(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Param('system', EnumSystemMediaPipe) system: EMediaSystem,
    @AuthUser() user: TUserDocument,
    @Body() body: FileUploadMultiDto,
  ) {
    try {
      if (system === EMediaSystem.S3) {
        const data = await this.mediaService.filesUploadInsertMediaS3(
          files,
          user,
          !!body.isWebp,
          undefined,
        );
        if (Array.isArray(data) && data?.length <= 0) {
          throw new BadRequestException({
            message: 'Upload file failed (S3)!',
          });
        }
        return { message: 'Upload file success (S3)!', data };
      }
      if (system === EMediaSystem.SERVER) return { message: 'Coming soon!' };
      return { message: 'Upload file failed!' };
    } catch (error) {
      Logger.error('🚀 ~ MediaController ~ createFile ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Get('file')
  @Auth(ACCESS.LIST_MEDIAS)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Get list file' })
  async findAllFile(@Query() query: QueryFileDto) {
    try {
      const { data, total } = await this.mediaService.findAllFile(query);
      return {
        message: 'Get Detail File Success!',
        data,
        total,
        page: +query.page,
        limit: +query.limit,
      };
    } catch (error) {
      Logger.error('🚀 ~ MediaController ~ findAllFile ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Get('file/:id')
  @Auth(ACCESS.VIEW_MEDIA)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Get detail file' })
  async findOneFile(@Param('id', MongoIdParam) id: string) {
    try {
      const data = await this.mediaService.findOneFile(id);
      if (!data) throw new NotFoundException({ message: 'File Not Found!' });
      return { message: 'Get Detail File Success!', data };
    } catch (error) {
      Logger.error('🚀 ~ MediaController ~ findOneFile ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Patch('file/:id')
  @Auth(ACCESS.UPDATE_MEDIA)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Update file by id' })
  async updateFile(
    @Param('id', MongoIdParam) id: string,
    @Body() body: UpdateFileDto,
    @AuthUser() user: TUserDocument,
  ) {
    try {
      const result = await this.mediaService.updateFile(id, body, user);
      if (!result)
        throw new BadRequestException({ message: 'Update file failed!' });
      return { message: 'Update File Success!' };
    } catch (error) {
      Logger.error('🚀 ~ MediaController ~ updateFile ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Delete('file/:id')
  @Auth(ACCESS.DELETE_MEDIA)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Delete file by id' })
  async deleteFile(@Param('id', MongoIdParam) id: string) {
    try {
      const result = await this.mediaService.removeFile(id);
      if (!result)
        throw new BadRequestException({ message: 'Delete file failed!' });
      return { message: 'Delete File Success!' };
    } catch (error) {
      Logger.error('🚀 ~ MediaController ~ deleteFile ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Post('file/delete-many')
  @Auth(ACCESS.DELETE_MEDIA)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Delete file by id' })
  async removeManyFile(@Body() { ids }: RemoveManyDto) {
    try {
      const result = await this.mediaService.removeManyFile(ids);
      if (!result)
        throw new BadRequestException({ message: 'Delete file failed!' });
      return { message: 'Delete File Success!' };
    } catch (error) {
      Logger.error('🚀 ~ MediaController ~ deleteManyFile ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Patch('file/move/:id')
  @Auth(ACCESS.UPDATE_MEDIA)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Move file by id' })
  async moveFile(
    @Param('id', new MongoIdParam([FOLDER_ROOT_ID])) id: string,
    @Body() body: MoveFileDto,
  ) {
    try {
      const result = await this.mediaService.moveFile(id, body);
      if (!result)
        throw new BadRequestException({ message: 'Move file failed!' });
      return { message: 'Move File Success!' };
    } catch (error) {
      Logger.error('🚀 ~ MediaController ~ deleteFile ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Put('file/resize/:id')
  @Auth(ACCESS.UPDATE_MEDIA)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Update file by id - COMING SOON' })
  async resizeFile(
    @Param('id', new MongoIdParam([FOLDER_ROOT_ID])) id: string,
    @Body() body: ResizeImageDto,
    @AuthUser() user: TUserDocument,
  ) {
    try {
      return { message: 'Resize File Success!', data: { body, user } };
    } catch (error) {
      Logger.error('🚀 ~ MediaController ~ resizeFile ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }
  // [END] - File Controller

  @Post('s3/upload')
  @Auth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Upload file or Multiple File not insert file DB' })
  @UseInterceptors(
    FastifyFilesInterceptor('file', 30, {
      limits: { fileSize: 1024 * 1024 * 15 },
      fileFilter: FileUploadHelper.fileFilter,
    }),
  )
  @ApiConsumes('multipart/form-data')
  async fileUpload(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body() body: FileUploadMultiDto,
  ) {
    const { isWebp } = body;
    try {
      // #1: Valid files
      FileUploadHelper.validationFilesBeforeUpload(files);

      // #2: Update file
      let data = [];
      data = await Promise.all(
        files.map(async (f) => {
          try {
            const upload = await this.mediaService.fileUploadS3(f, !!isWebp);
            if (upload) {
              return upload?.Location;
            }

            return null;
          } catch (error) {
            return null;
          }
        }),
      );
      data = data.filter((e) => !!e);
      if (data.length === 1) {
        data = data.pop();
      }
      return { message: 'File Upload Success!', data };
    } catch (error) {
      Logger.error('🚀 ~ MediaController ~ fileUpload ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }
}
