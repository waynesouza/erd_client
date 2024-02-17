import {Entity} from "./entity.model";

export interface DiagramData {
  nodeDataArray: Entity[];
  linkDataArray: {
    from: string;
    to: string;
    text: string;
    toText: string;
  }[];
}
