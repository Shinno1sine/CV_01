import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Logger,
  HttpException,
  BadRequestException,
  HttpCode,
  HttpStatus,
  Query,
  NotFoundException,
  Put,
} from '@nestjs/common';
import { TaxonomyService } from './taxonomy.service';
import { CreateTaxonomyDto } from './dto/create-taxonomy.dto';
import { MoveTaxonomyDto, UpdateTaxonomyDto } from './dto/update-taxonomy.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TUserDocument } from '@modules/user/entities/user.entity';
import { Auth, AuthUser } from '@modules/auth/auth.decorator';
import { TTaxonomyDocument } from './entities/taxonomy.entity';
import { IRes, IResListData } from '@configs/interface.config';
import { ACCESS } from '@configs/permission.config';
import {
  QueryMakeTreeTaxDto,
  QueryTaxonomyDto,
} from './dto/query-taxonomy.dto';
import { MongoIdParam } from '@src/validations/mongoId-param.pipe';
import { SlugParamPipe } from '@src/validations/slug-param.pipe';
import { TAXONOMY_ROOT_ID } from './seed/taxonomy.seed';
import { UpdateSlugDto } from '@src/base/dto/update-slug.dto';
import { PostTypePipe } from '@src/validations/post-type.pipe';

@ApiTags('taxonomy')
@Controller('v1/taxonomy')
export class TaxonomyController {
  constructor(private readonly taxonomyService: TaxonomyService) {}

  @Post()
  @Auth(ACCESS.CREATE_TAXONOMY)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Create Taxonomy' })
  async create(
    @Body() body: CreateTaxonomyDto,
    @AuthUser() user: TUserDocument,
  ): Promise<IRes<TTaxonomyDocument>> {
    try {
      const data = await this.taxonomyService.create(body, user);
      if (!data?._id)
        throw new BadRequestException({ message: 'Create Taxonomy Failed!' });
      return { message: 'Create Taxonomy Success!', data };
    } catch (error) {
      Logger.error('🚀 ~ TaxonomyController ~ create ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[USER/ADMIN] Get list taxonomy' })
  async findAll(
    @Query() query: QueryTaxonomyDto,
  ): Promise<IResListData<TTaxonomyDocument[]>> {
    try {
      const { data, total } = await this.taxonomyService.findAll(query);
      return {
        message: 'Get List Taxonomy Success!',
        data: data,
        total,
        page: +query.page,
        limit: +query.limit,
      };
    } catch (error) {
      Logger.error('🚀 ~ TaxonomyController ~ findAll ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Get('make/tree/:postType')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Get list taxonomy, make tree' })
  async findAllFolderMakeTree(
    @Param('postType', new PostTypePipe()) postType: string,
    @Query() query: QueryMakeTreeTaxDto,
  ) {
    try {
      const { taxonomyId } = query;
      const data = await this.taxonomyService.findAllTaxonomyMakeTree(
        taxonomyId,
        postType,
      );

      return { message: 'Generator tree folder success!', data };
    } catch (error) {
      Logger.error(
        '🚀 ~ TaxonomyController ~ findAllFolderMakeTree ~ error',
        error,
      );
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Get(':id')
  @Auth(ACCESS.VIEW_TAXONOMY)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Get detail Taxonomy' })
  async findOne(
    @Param('id', new MongoIdParam([TAXONOMY_ROOT_ID])) id: string,
  ): Promise<IRes<TTaxonomyDocument>> {
    try {
      const data = await this.taxonomyService.findOne(id);
      if (!data)
        throw new NotFoundException({ message: 'Taxonomy not found!' });
      return { message: 'Get Detail Taxonomy Success!', data };
    } catch (error) {
      Logger.error('🚀 ~ TaxonomyController ~ findOne ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Patch(':id')
  @Auth(ACCESS.UPDATE_TAXONOMY)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Update Taxonomy by id' })
  async update(
    @Param('id', new MongoIdParam([TAXONOMY_ROOT_ID])) id: string,
    @AuthUser() user: TUserDocument,
    @Body() body: UpdateTaxonomyDto,
  ) {
    try {
      const result = await this.taxonomyService.update(id, body, user);
      if (!result)
        throw new BadRequestException({ message: 'Update Taxonomy failed!' });
      return { message: 'Update Taxonomy success!' };
    } catch (error) {
      Logger.error('🚀 ~ TaxonomyController ~ update ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Delete(':id')
  @Auth(ACCESS.DELETE_TAXONOMY)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Delete Taxonomy by id' })
  async remove(@Param('id', new MongoIdParam([TAXONOMY_ROOT_ID])) id: string) {
    try {
      const result = await this.taxonomyService.remove(id);
      if (!result) return { message: 'Delete Taxonomy Failed!' };
      return { message: 'Delete Taxonomy Success!' };
    } catch (error) {
      Logger.error('🚀 ~ TaxonomyController ~ remove ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Patch('move/:id')
  @Auth(ACCESS.UPDATE_TAXONOMY)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Move Taxonomy by id' })
  async move(
    @Param('id', new MongoIdParam([TAXONOMY_ROOT_ID])) id: string,
    @AuthUser() user: TUserDocument,
    @Body() body: MoveTaxonomyDto,
  ) {
    try {
      const result = await this.taxonomyService.move(
        id,
        user,
        body.newParentId,
      );
      if (!result) return { message: 'Moving Taxonomy Failed!' };
      return { message: 'Moving Taxonomy Success!' };
    } catch (error) {
      Logger.error('🚀 ~ TaxonomyController ~ move ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Get(':slug/detail')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[USER] Get detail Taxonomy by slug' })
  async findOneBySlug(
    @Param('slug', SlugParamPipe) slug: string,
  ): Promise<IRes<TTaxonomyDocument>> {
    try {
      const data = await this.taxonomyService.findOneBySlug(slug);
      if (!data)
        throw new NotFoundException({ message: 'Taxonomy not found!' });
      return { message: 'Get detail Taxonomy success!', data };
    } catch (error) {
      Logger.error('🚀 ~ TaxonomyController ~ findOneBySlug ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }

  @Put(':id/slug')
  @Auth(ACCESS.UPDATE_POST)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Update slug post' })
  async updateSlug(
    @Param('id', MongoIdParam) id: string,
    @Body() body: UpdateSlugDto,
  ): Promise<IRes> {
    const { slug } = body;
    try {
      const result = await this.taxonomyService.updateSlugBase(id, slug);
      if (!result)
        throw new NotFoundException({ message: 'Update Slug post failed!' });
      return { message: 'Update Slug post success!' };
    } catch (error) {
      Logger.error('🚀 ~ PostController ~ updateSlug ~ error', error);
      throw new HttpException({ message: error?.message }, error?.status);
    }
  }
}
