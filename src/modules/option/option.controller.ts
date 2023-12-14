import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  HttpCode,
  HttpStatus,
  HttpException,
  Logger,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { OptionService } from './option.service';
import { CreateUpdateManyOptionDto } from './dto/create-update-option.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Auth, AuthUser } from '../auth/auth.decorator';
import { IRes } from '@src/configs/interface.config';
import { ACCESS } from '@src/configs/permission.config';
import { TUserDocument } from '../user/entities/user.entity';
import { TResCreateUpdateOption } from './option.interface';
import { ActionOptionByKeysDto, QueryOptionDto } from './dto/query-option.dto';

@ApiTags('option')
@Controller('v1/option')
export class OptionController {
  constructor(private readonly optionService: OptionService) {}

  @Post()
  @Auth(ACCESS.CREATE_UPDATE_OPTION)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Create / update options' })
  async create(
    @Body() body: CreateUpdateManyOptionDto,
    @AuthUser() user: TUserDocument,
  ): Promise<IRes<TResCreateUpdateOption[]>> {
    try {
      const res = await this.optionService.create(body, user);
      return { message: 'Create/Update options', data: res };
    } catch (error) {
      Logger.error('🚀 ~ OptionController ~ create ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Get()
  @Auth(ACCESS.LIST_OPTION)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Get options' })
  async findAll(@Query() query: QueryOptionDto) {
    try {
      const { data, total } = await this.optionService.findAll(query);
      return {
        message: 'Get List Option Success!',
        data: data,
        total,
        page: +query.page,
        limit: +query.limit,
      };
    } catch (error) {
      Logger.error('🚀 ~ OptionController ~ findAll ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Get('keys')
  @Auth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN & USER] Get options by keys' })
  async findByKeys(@Query() query: ActionOptionByKeysDto) {
    try {
      const keys = Array.isArray(query['key[]'])
        ? query['key[]']
        : [query['key[]']];
      const data = await this.optionService.findByKeys(keys);
      return { message: 'Get Options Success!', data };
    } catch (error) {
      Logger.error('🚀 ~ OptionController ~ findByKeys ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Delete('keys')
  @Auth(ACCESS.DELETE_OPTION)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Delete options by keys' })
  async remove(@Body() body: ActionOptionByKeysDto) {
    try {
      const res = await this.optionService.remove(body['key[]']);
      if (!res) {
        throw new BadRequestException({
          message: 'Delete Options Failed!',
        });
      }
      return { message: 'Delete Options Success!' };
    } catch (error) {
      Logger.error('🚀 ~ OptionController ~ remove ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }
}
