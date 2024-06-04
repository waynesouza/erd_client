import { DataType } from './enum/datatype.enum';

export interface AttributeModel {

  name: string;
  type: DataType | null;
  pk: boolean;
  fk: boolean;
  unique: boolean;
  defaultValue: string;
  nullable: boolean;
  autoIncrement: boolean;

}
