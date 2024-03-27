import { Point } from 'gojs';
import { AttributeModel } from './attribute.model';

export interface EntityModel {

  id: string;
  key: string;
  items: AttributeModel[];
  location: Point;

}
