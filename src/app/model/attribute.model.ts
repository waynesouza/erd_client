export interface AttributeModel {

  name: string;
  type: string;
  pk: boolean;
  fk: boolean;
  unique: boolean;
  defaultValue: string;
  nullable: boolean;
  autoIncrement: boolean;

}
