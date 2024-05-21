import { Component, Input, OnInit } from '@angular/core';
import * as go from 'gojs';
// @ts-ignore
import * as sockjs from 'sockjs-client';
// @ts-ignore
import * as stomp from 'stompjs';
import { DiagramService } from '../service/diagram.service';
import { DiagramModel } from '../model/diagram.model';
import { EntityModel } from '../model/entity.model';
import { SharedService } from '../service/shared.service';
import { IntermediaryEntityModel } from '../model/intermediary-entity.model';
import { AttributeModel } from '../model/attribute.model';
import { LinkDataModel } from '../model/link-data.model';

const $ = go.GraphObject.make;

@Component({
  selector: 'app-diagram',
  templateUrl: './diagram.component.html',
  styleUrls: ['./diagram.component.css']
})
export class DiagramComponent implements OnInit {

  @Input() entities: EntityModel[] = [];
  @Input() selectedProjectId: string = '';
  relationships: any[] = [];
  locations: go.Point[] = [];
  darkMode: boolean = false;
  showTableEditor: boolean = false;
  selectedItem: any = null;
  selectedEntity: any = {};
  selectedRelationshipType: '1:1' | '1:N' | 'N:N' | null = null;
  selectedEntities: any[] = [];
  projectId: string = '';
  isEntityEditorModalOpen: boolean = false;
  // @ts-ignore
  public diagram: go.Diagram = null;

  private stompClient: any;

  constructor(private diagramService: DiagramService, private sharedService: SharedService) { }

  ngOnInit(): void {
    const socket = new sockjs('http://localhost:8080/api/send');
    this.stompClient = stomp.over(socket);

    this.stompClient.connect({}, () => {
      this.stompClient.subscribe('/topic/receive', (message: any) => {
        console.log('Received message from server:', message);
        this.receiveMessageAndRemakeDiagram(message);
      });
    });

    this.sharedService.currentProjectId.subscribe(projectId => {
      if (projectId) {
        this.projectId = projectId;
        this.diagramService.getDiagram(projectId).subscribe({
          next: (diagramData: DiagramModel) => {
            this.locations = diagramData.nodeDataArray.map((entity: EntityModel) => {
              return new go.Point(Number(entity.location.x), Number(entity.location.y));
            });
            this.entities = diagramData.nodeDataArray;
            this.relationships = diagramData.linkDataArray;
            this.initializeDiagram();
            this.remakeDiagram();
          }, error: () => {
            this.initializeDiagram();
          }
        });
      }
    });
  }

  private initializeDiagram(): void {
    this.diagram = $(go.Diagram, 'myDiagramDiv', {});

    this.diagram.model = new go.GraphLinksModel({nodeDataArray: this.entities});

    const itemTemplate = $(go.Panel, 'Horizontal',
      $(go.Shape,
        {desiredSize: new go.Size(15, 15), strokeJoin: 'round', strokeWidth: 3, stroke: '#eeeeee', margin: 2},
        new go.Binding('figure', 'figure')
      ),
      $(go.TextBlock,
        {font: '14px sans-serif', stroke: 'black'},
        new go.Binding('text', 'name'), new go.Binding('stroke', '', n => (this.diagram.model.modelData['darkMode']) ? '#f5f5f5' : '#000000')),
    );

    this.diagram.nodeTemplate = $(go.Node, 'Auto', {
        selectionAdorned: true,
        resizable: true,
        fromSpot: go.Spot.LeftRightSides,
        toSpot: go.Spot.LeftRightSides,
        isShadowed: true,
        shadowOffset: new go.Point(4, 4),
        shadowColor: '#919cab',
        click: (e, node) => {
          // @ts-ignore
          this.entityClicked(node.part.data);
        }
      },
      new go.Binding('location', 'location').makeTwoWay(),
      new go.Binding('desiredSize', 'visible', v => new go.Size(NaN, NaN)).ofObject('LIST'),
      $(go.Shape, 'RoundedRectangle',
        {stroke: '#e8f1ff', strokeWidth: 3},
        new go.Binding('fill', '', n => (this.diagram.model.modelData['darkMode']) ? '#4a4a4a' : '#f7f9fc')
      ),
      $(go.Panel, 'Table',
        {
          margin: 8,
          stretch: go.GraphObject.Fill,
          width: 160
        },
        $(go.RowColumnDefinition, {row: 0, sizing: go.RowColumnDefinition.None}),
        $(go.TextBlock,
          {
            row: 0, alignment: go.Spot.Center,
            editable: true,
            margin: new go.Margin(0, 24, 0, 2),
            font: 'bold 16px sans-serif'
          },
          new go.Binding('text', 'key').makeTwoWay(),
          new go.Binding('stroke', '', n => (this.diagram.model.modelData['darkMode']) ? '#d6d6d6' : '#000000')),
        $('PanelExpanderButton', 'LIST',
          {row: 0, alignment: go.Spot.TopRight},
          new go.Binding('ButtonIcon.stroke', '', n => (this.diagram.model.modelData['darkMode']) ? '#d6d6d6' : '#000000')),
        $(go.Panel, 'Table',
          {name: 'LIST', row: 1, stretch: go.GraphObject.Horizontal},
          $(go.TextBlock,
            {
              font: 'bold 15px sans-serif',
              text: 'Attributes',
              row: 0,
              alignment: go.Spot.TopLeft,
              margin: new go.Margin(8, 0, 0, 0),
            },
            new go.Binding('stroke', '', n => (this.diagram.model.modelData['darkMode']) ? '#d6d6d6' : '#000000')),
          $('PanelExpanderButton', 'NonInherited',
            {
              row: 0,
              column: 1
            },
            new go.Binding('ButtonIcon.stroke', '', n => (this.diagram.model.modelData['darkMode']) ? '#d6d6d6' : '#000000')),
          $(go.Panel, 'Vertical',
            {
              name: 'NonInherited',
              alignment: go.Spot.TopLeft,
              defaultAlignment: go.Spot.Left,
              itemTemplate: itemTemplate,
              row: 1
            },
            new go.Binding('itemArray', 'items')),
        )
      ),
    );

    this.diagram.linkTemplate = $(go.Link, {
        selectionAdorned: true,
        curve: go.Link.JumpOver,
        corner: 5,
        layerName: 'Background',
        isShadowed: true,
        shadowColor: '#919cab',
        shadowOffset: new go.Point(2, 2),
        routing: go.Link.AvoidsNodes
      },
      $(go.Shape,
        {stroke: '#f7f9fc', strokeWidth: 4}),
      $(go.Panel, 'Auto', {segmentIndex: 0, segmentOffset: new go.Point(22, 0)},
        $(go.Shape, 'RoundedRectangle', {fill: '#f7f9fc'}, {stroke: '#eeeeee'}),
        $(go.TextBlock,  // the 'from' label
          {
            textAlign: 'center',
            font: 'bold 14px sans-serif',
            stroke: 'black',
            background: '#f7f9fc',
            segmentOffset: new go.Point(NaN, NaN),
            segmentOrientation: go.Link.OrientUpright
          },
          new go.Binding('text', 'text'))),
      $(go.Panel, 'Auto',
        {
          segmentIndex: -1,
          segmentOffset: new go.Point(-13, 0)
        },
        $(go.Shape, 'RoundedRectangle', {fill: '#edf6fc'}, {stroke: '#eeeeee'}),
        $(go.TextBlock,  // the 'to' label
          {
            textAlign: 'center',
            font: 'bold 14px sans-serif',
            stroke: 'black',
            segmentIndex: -1,
            segmentOffset: new go.Point(NaN, NaN),
            segmentOrientation: go.Link.OrientUpright
          },
          new go.Binding('text', 'toText')),
        $(go.Panel, 'Auto',
          {
            segmentIndex: 0,
            segmentOffset: new go.Point(0, 0),
            segmentOrientation: go.Link.OrientUpright
          },
          $(go.Shape, 'Circle', {fill: '#f7f9fc', stroke: '#eeeeee', width: 16, height: 16})
        )),
    );

    this.diagram.nodeTemplate.doubleClick = (e: go.InputEvent, node: go.GraphObject): void => {
      // @ts-ignore
      const clickedNode = node.part.data;
      this.showTableEditorModal(clickedNode);
    }

    // Event listener for pressing the delete key
    this.diagram.commandHandler.deleteSelection = () : void => {
      let selection: go.Set<go.Part> = this.diagram.selection;

      selection.each((part: go.Part): void => {
        if (part instanceof go.Node) {
          this.handleRemove(part.data.id);
        } else if (part instanceof go.Link) {
          this.removeRelationship(part.data.id);
        } else {
          return;
        }
      });

      go.CommandHandler.prototype.deleteSelection.call(this.diagram.commandHandler);
    };
  }

  toggleDarkMode(): void {
    this.darkMode = !this.darkMode;
  }

  addEntity(): void {
    const newEntity: EntityModel = {
      id: crypto.randomUUID(),
      key: `table${this.entities.length + 1}`,
      items: [],
      location: new go.Point(Math.random() * 400, Math.random() * 400)
    };

    this.entities.push(newEntity);
    this.diagram.model = new go.GraphLinksModel({
      nodeDataArray: this.entities,
      linkDataArray: this.relationships
    });
  }

  // Entity editor
  showTableEditorModal(entity: any): void {
    this.selectedEntity = entity;
    console.log('aqui');
    this.openEntityEditorModal();
  }

  handleSave(entity: any): void {
    this.showTableEditor = false;
    const index: number = this.entities.findIndex((e: EntityModel) : boolean => e.id === entity.id);

    const oldKey: string = this.entities[index].key;
    const newKey = entity.key;

    this.entities[index] = entity;

    this.relationships.forEach((relationship): void => {
      if (relationship.from === oldKey) {
        relationship.from = newKey;
      }
      if (relationship.to === oldKey) {
        relationship.to = newKey;
      }
    });

    this.diagram.model = new go.GraphLinksModel( {
      nodeDataArray: this.entities,
      linkDataArray: this.relationships
    });
  }

  handleRemove(id: string): void {
    this.showTableEditor = false;
    const removedEntity: EntityModel | undefined = this.entities.find((e: EntityModel) : boolean => e.id === id);

    if (removedEntity) {
      this.entities.forEach((entity: EntityModel) : void => {
        const fkIndex: number = entity.items.findIndex((item: AttributeModel) : boolean => item.name === `${removedEntity.key}_id`);
        if (fkIndex !== -1) {
          entity.items.splice(fkIndex, 1);
        }
      });
    }

    this.entities = this.entities.filter((e: EntityModel) : boolean => e.id !== id);
    this.relationships = this.relationships.filter(r => r.from !== id && r.to !== id);
    this.diagram.model = new go.GraphLinksModel({
      nodeDataArray: this.entities,
      linkDataArray: this.relationships
    });
  }

  handleClose(): void {
    this.showTableEditor = false;
  }

  selectRelationshipType(type: '1:1' | '1:N' | 'N:N'): void {
    this.selectedRelationshipType = type;
    this.selectedEntities = [];
  }

  entityClicked(entity: any): void {
    if (this.selectedRelationshipType && this.selectedEntities.length < 2) {
      this.selectedEntities.push(entity);
    }

    if (this.selectedEntities.length === 2) {
      if (this.selectedRelationshipType === 'N:N') {
        const firstForeignKey: AttributeModel = {
          name: `${this.selectedEntities[0].key}_id`,
          // @ts-ignore
          type: this.selectedEntities[0].items.filter(item => item.pk)[0].type,
          pk: false,
          fk: true,
          unique: false,
          defaultValue: '',
          nullable: false,
          autoIncrement: false
        };

        const secondForeignKey: AttributeModel = {
          name: `${this.selectedEntities[1].key}_id`,
          // @ts-ignore
          type: this.selectedEntities[1].items.filter(item => item.pk)[0].type,
          pk: false,
          fk: true,
          unique: false,
          defaultValue: '',
          nullable: false,
          autoIncrement: false
        };

        const newIntermediaryEntity: IntermediaryEntityModel = {
          id: crypto.randomUUID(),
          key: `${this.selectedEntities[0].key}_${this.selectedEntities[1].key}`,
          items: [firstForeignKey, secondForeignKey],
          location: new go.Point(Math.random() * 400, Math.random() * 400),
          firstEntityId: this.selectedEntities[0].key,
          secondEntityId: this.selectedEntities[1].key
        };

        this.entities.push(newIntermediaryEntity);

        const firstLinkData: LinkDataModel = {
          id: crypto.randomUUID(),
          from: this.selectedEntities[0].key,
          to: newIntermediaryEntity.key,
          text: '1:N',
          toText: 1,
        };

        const secondLinkData: LinkDataModel = {
          id: crypto.randomUUID(),
          from: newIntermediaryEntity.key,
          to: this.selectedEntities[1].key,
          text: '1:N',
          toText: 1,
        };

        this.createRelationship(firstLinkData);
        this.createRelationship(secondLinkData);

        this.remakeDiagram();
      } else {
        const foreignKeyAttribute: AttributeModel = {
          name: `${this.selectedEntities[1].key}_id`,
          // @ts-ignore
          type: this.selectedEntities[1].items.filter(item => item.pk)[0].type,
          pk: false,
          fk: true,
          unique: false,
          defaultValue: '',
          nullable: false,
          autoIncrement: false
        };

        this.selectedEntities[0].items.push(foreignKeyAttribute);

        const linkData: LinkDataModel = {
          id: crypto.randomUUID(),
          from: this.selectedEntities[0].key,
          to: this.selectedEntities[1].key,
          text: this.selectedRelationshipType,
          toText: 1,
        };

        this.createRelationship(linkData);
      }

      this.selectedRelationshipType = null;
    }
  }

  createRelationship(linkData: any): void {
    this.relationships.push(linkData);
    this.remakeDiagram();
    this.selectedEntities = [];
  }

  removeRelationship(id: string): void {
    let relationshipToRemove: any = {};
    const index: number = this.relationships.findIndex(r => r.id === id);

    if (index !== -1) {
      relationshipToRemove = this.relationships.splice(index, 1)[0];
    }

    if (relationshipToRemove.text === '1:1' || relationshipToRemove.text === '1:N') {
      const entity: EntityModel | undefined = this.entities.find((e: EntityModel) : boolean => e.key === relationshipToRemove.from);
      if (entity) {
        const fkIndex: number = entity.items.findIndex((item: AttributeModel) : boolean => item.name === `${relationshipToRemove.to}_id`);
        if (fkIndex !== -1) {
          entity.items.splice(fkIndex, 1);
        }
      }
    }

    this.remakeDiagram();
  }

  remakeDiagram(): void {
    this.entities.forEach((entity: EntityModel, index: number): void => {
      entity.location = this.locations[index];
    });
    this.diagram.model = new go.GraphLinksModel({
      nodeDataArray: this.entities,
      linkDataArray: this.relationships
    });
  }

  receiveMessageAndRemakeDiagram(message: any): void {
    const data = JSON.parse(message.body);
    this.locations = data.nodeDataArray.map((entity: EntityModel) => {
      return new go.Point(Number(entity.location.x), Number(entity.location.y));
    });
    this.entities = data.nodeDataArray;
    this.relationships = data.linkDataArray;
    this.remakeDiagram();
  }

  // Entity editor modal
  openEntityEditorModal(): void {
    this.isEntityEditorModalOpen = true;
    console.log(this.isEntityEditorModalOpen);
  }

  closeEntityEditorModal(): void {
    this.isEntityEditorModalOpen = false;
  }

  sendToServer(): void {
    const message: string = JSON.stringify({
      nodeDataArray: this.entities,
      linkDataArray: this.relationships,
      projectId: this.projectId,
      darkMode: this.darkMode
    });

    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.send('/app/send', {}, message);
    } else {
      console.log('Cannot send message, stompClient is not connected');
    }
  }

}
