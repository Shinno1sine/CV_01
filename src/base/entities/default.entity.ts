import { User } from '@modules/user/entities/user.entity';
import { Prop } from '@nestjs/mongoose';
import { Schema } from 'mongoose';
import { EStatusDoc } from '@configs/interface.config';

export class PersonResponsibleEntity {
  @Prop({ type: Schema.Types.ObjectId, ref: 'user', default: null })
  author: User;

  @Prop({ type: Schema.Types.ObjectId, ref: 'user', default: null })
  editedBy: User;
}

export class StatusDocEntity {
  @Prop({ type: String, enum: EStatusDoc, default: EStatusDoc.INACTIVE })
  status: EStatusDoc;
}

export class DefaultEntity extends PersonResponsibleEntity {
  @Prop({ type: String, enum: EStatusDoc, default: EStatusDoc.INACTIVE })
  status: EStatusDoc;
}
