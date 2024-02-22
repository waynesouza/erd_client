import { EntityModel } from './entity.model';

export interface DiagramModel {

  nodeDataArray: EntityModel[];
  linkDataArray: {
    from: string;
    to: string;
    text: string;
    toText: string;
  }[];

}
