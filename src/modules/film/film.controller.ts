import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpException,
  Logger,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Auth, AuthUser } from '@modules/auth/auth.decorator';
import { ACCESS } from '@configs/permission.config';
import { TUserDocument } from '@modules/user/entities/user.entity';
import { MongoIdParam } from 'src/validations/mongoId-param.pipe';
import { SlugParamPipe } from 'src/validations/slug-param.pipe';
import { IRes } from '@configs/interface.config';
import { UpdateSlugDto } from 'src/base/dto/update-slug.dto';
import { RemoveManyDto } from '@src/base/dto/remove-many.dto';
import { FilmService } from './film.service';
import { CreateFilmDto } from './dto/create-film.dto';
import { TFilmDocument } from './entities/film.entity';
import { QueryClientFilmDto, QueryFilmDto } from './dto/query-film.dto';
import { UpdateFilmDto } from './dto/update-film.dto';

@ApiTags('film')
@Controller('v1/film')
export class FilmController {
  constructor(private readonly filmService: FilmService) {}

  @Post()
  @Auth(ACCESS.CREATE_FILM)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Create Film' })
  async create(
    @Body() body: CreateFilmDto,
    @AuthUser() user: TUserDocument,
  ): Promise<IRes<TFilmDocument>> {
    try {
      const data = await this.filmService.create(body, user);
      if (!data?._id)
        throw new BadRequestException({ message: 'Create Film Failed!' });
      return { message: 'Create Film Success!', data };
    } catch (error) {
      Logger.error('🚀 ~ FilmController ~ create ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Get()
  @Auth(ACCESS.LIST_FILM)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Get List Film' })
  async findAll(@Query() query: QueryFilmDto): Promise<IRes<TFilmDocument[]>> {
    try {
      const { data, total } = await this.filmService.findAll(query, true);
      return {
        message: 'Get List Film Success!',
        data: data,
        total,
        page: +query.page,
        limit: +query.limit,
      };
    } catch (error) {
      Logger.error('🚀 ~ FilmController ~ findAll ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Get('client')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[USER] Get List Film' })
  async clientFindAll(
    @Query() query: QueryClientFilmDto,
  ): Promise<IRes<TFilmDocument[]>> {
    try {
      const { data, total } = await this.filmService.findAll(query);
      return {
        message: 'Get List Film Success!',
        data: data,
        total,
        page: +query.page,
        limit: +query.limit,
      };
    } catch (error) {
      Logger.error('🚀 ~ FilmController ~ findAll ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Get('total')
  @Auth(ACCESS.LIST_FILM)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Get total Film in system' })
  async findTotal(): Promise<IRes<number>> {
    try {
      const data = await this.filmService.findTotal();
      return { message: 'Get total Film success!', data };
    } catch (error) {
      Logger.error('🚀 ~ FilmController ~ findTotal ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Get(':id')
  @Auth(ACCESS.VIEW_FILM)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Get detail Film by id' })
  async findOne(
    @Param('id', MongoIdParam) id: string,
  ): Promise<IRes<TFilmDocument>> {
    try {
      const data = await this.filmService.findOne(id);
      if (!data) throw new NotFoundException({ message: 'Film not found!' });
      return { message: 'Get detail Film success!', data };
    } catch (error) {
      Logger.error('🚀 ~ FilmController ~ findOne ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Get(':id/client')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[USER] Get detail Film by id' })
  async clientFindOne(
    @Param('id', MongoIdParam) id: string,
  ): Promise<IRes<TFilmDocument>> {
    try {
      const data = await this.filmService.findOne(id, false);
      if (!data) throw new NotFoundException({ message: 'Film not found!' });
      return { message: 'Get detail Film success!', data };
    } catch (error) {
      Logger.error('🚀 ~ FilmController ~ findOne ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Patch(':id')
  @Auth(ACCESS.UPDATE_FILM)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Update Film by id' })
  async update(
    @Param('id', MongoIdParam) id: string,
    @Body() body: UpdateFilmDto,
    @AuthUser() user: TUserDocument,
  ): Promise<IRes> {
    try {
      const result = await this.filmService.update(id, body, user);
      if (!result)
        throw new BadRequestException({ message: 'Update Film failed!' });
      return { message: 'Update Film success!' };
    } catch (error) {
      Logger.error('🚀 ~ FilmController ~ update ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Delete(':id')
  @Auth(ACCESS.DELETE_FILM)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Delete Film by id' })
  async remove(@Param('id', MongoIdParam) id: string): Promise<IRes> {
    try {
      const result = await this.filmService.removeBase(id);
      if (!result)
        throw new BadRequestException({
          message: 'Delete Film Failed!',
        });
      return { message: 'Delete Film Success!' };
    } catch (error) {
      Logger.error('🚀 ~ FilmController ~ remove ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Put(':id/slug')
  @Auth(ACCESS.UPDATE_FILM)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Update slug Film' })
  async updateSlug(
    @Param('id', MongoIdParam) id: string,
    @Body() body: UpdateSlugDto,
  ): Promise<IRes> {
    const { slug } = body;
    try {
      const result = await this.filmService.updateSlugBase(id, slug);
      if (!result)
        throw new NotFoundException({ message: 'Update Slug Film failed!' });
      return { message: 'Update Slug Film success!' };
    } catch (error) {
      Logger.error('🚀 ~ FilmController ~ updateSlug ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Get(':slug/detail')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[USER] Get detail Film by slug' })
  async findOneBySlug(
    @Param('slug', SlugParamPipe) slug: string,
  ): Promise<IRes<TFilmDocument>> {
    try {
      const data = await this.filmService.findOneBySlug(slug);
      if (!data) throw new NotFoundException({ message: 'Film not found!' });
      return { message: 'Get detail Film success!', data };
    } catch (error) {
      Logger.error('🚀 ~ FilmController ~ findOneBySlug ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Post('delete-many')
  @Auth(ACCESS.DELETE_FILM)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Delete Film by ids' })
  async removeMany(@Body() body: RemoveManyDto): Promise<IRes> {
    try {
      const result = await this.filmService.removeManyBase(body);
      if (!result)
        throw new BadRequestException({
          message: 'Delete Film Failed!',
        });
      return { message: 'Delete Film Success!' };
    } catch (error) {
      Logger.error('🚀 ~ FilmController ~ removeMany ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }
}
