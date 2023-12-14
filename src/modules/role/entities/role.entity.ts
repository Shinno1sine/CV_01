import { ACCESS } from '@configs/permission.config';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TRoleDocument = Role & Document<Types.ObjectId>;

@Schema({ timestamps: true, collection: 'role' })
export class Role {
  @Prop({
    required: true,
    unique: true,
    index: true,
    type: String,
    uppercase: true,
  })
  code: string;

  @Prop({ type: String })
  description: string;

  @Prop({ default: [], type: Array, enum: ACCESS })
  permissions: string[];

  @Prop({ default: true, type: Boolean })
  isActive: boolean;
}

const RoleSchema = SchemaFactory.createForClass(Role);

// RoleSchema.pre('findOne', function () {
//   this.where({ isActive: true });
// });
// RoleSchema.pre('find', function () {
//   this.where({ isActive: true });
// });

export { RoleSchema };
