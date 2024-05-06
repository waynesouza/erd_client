import { EntityModel } from './entity.model';

export interface IntermediaryEntityModel extends EntityModel {

  firstEntityId: string;
  secondEntityId: string;

}
