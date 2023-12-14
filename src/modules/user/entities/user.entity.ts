import { TRoleDocument } from '@modules/role/entities/role.entity';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { emailRegex, usernameRegex } from '@utils/string.util';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { PasswordService } from 'src/base/service/password.service';
import { File } from '@modules/media/entities/file.entity';

export type TUserDocument = User & Document<Types.ObjectId>;

@Schema({ timestamps: true, collection: 'user' })
export class User {
  @Prop({
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
    index: true,
    type: String,
    match: usernameRegex,
  })
  username: string;

  @Prop({
    required: true,
    type: String,
    select: false,
  })
  password: string;

  @Prop({ type: String, default: null, match: emailRegex })
  email: string;

  @Prop({ type: String, default: null, maxlength: 20 })
  phone: string;

  @Prop({ type: String, default: null, maxlength: 20 })
  lastName: string;

  @Prop({ type: String, default: null, maxlength: 20 })
  firstName: string;

  @Prop({ type: Boolean, default: false, index: true })
  isActive: boolean;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'file', default: null })
  avatar: File;

  @Prop({
    default: [],
    type: [{ ref: 'role', type: MongooseSchema.Types.ObjectId }],
  })
  roles: TRoleDocument[];

  @Prop({ type: [String], default: [] })
  devices: [string];

  @Prop({ type: Boolean, default: true })
  allowNotification: boolean;

  //...
}

const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre<TUserDocument>('validate', function () {
  if (this.isNew && this.password) {
    const passwordService = new PasswordService();
    this.password = passwordService.hashingPassword(this.password);
  }
});

UserSchema.pre<TUserDocument>('updateOne', function () {
  if (this.password && this.isModified) {
    const passwordService = new PasswordService();
    this.password = passwordService.hashingPassword(this.password);
  }
});

UserSchema.post<TUserDocument>('save', function () {
  this.password = undefined;
  return this;
});

export { UserSchema };
