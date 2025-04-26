import { Component, Input, OnDestroy, OnInit } from '@angular/core';
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
    this.diagram = $(go.Diagram, 'myDiagramDiv', {
      initialContentAlignment: go.Spot.Center,
      "animationManager.isEnabled": false,
      "undoManager.isEnabled": true,
      allowDelete: true,
      allowCopy: false,
      "toolManager.mouseWheelBehavior": go.ToolManager.WheelZoom,
      "clickCreatingTool.archetypeNodeData": { text: "new node" },
      model: new go.GraphLinksModel([])
    });

    this.diagram.model = new go.GraphLinksModel({nodeDataArray: this.entities});

    const itemTemplate = $(go.Panel, "Horizontal",
      $(go.Shape,
        {
          width: 16,
          height: 16,
          margin: new go.Margin(0, 8, 0, 0),
        },
        new go.Binding("figure", "pk", pk => pk ? "Diamond" : "Circle"),
        new go.Binding("fill", "pk", pk => pk ? "#8b5cf6" : "#6366f1"),
        new go.Binding("stroke", "pk", pk => pk ? "#7c3aed" : "#4f46e5")
      ),
      $(go.TextBlock,
        {
          font: "14px Inter, system-ui, sans-serif",
          margin: new go.Margin(0, 8, 0, 0),
        },
        new go.Binding("text", "name"),
        new go.Binding("stroke", "", () => this.darkMode ? "#f3f4f6" : "#1f2937")
      ),
      $(go.TextBlock,
        {
          font: "14px Inter, system-ui, sans-serif",
          stroke: "#6b7280"
        },
        new go.Binding("text", "type")
      )
    );

    this.diagram.nodeTemplate =
      $(go.Node, "Auto",
        {
          selectionAdorned: true,
          resizable: true,
          layoutConditions: go.Part.LayoutStandard & ~go.Part.LayoutNodeSized,
          fromSpot: go.Spot.AllSides,
          toSpot: go.Spot.AllSides,
          isShadowed: true,
          shadowOffset: new go.Point(2, 2),
          shadowColor: "rgba(0,0,0,0.2)",
          click: (e: go.InputEvent, node: go.GraphObject): void => {
            // @ts-ignore
            this.entityClicked(node.part.data);
          }
        },
        new go.Binding("location", "location").makeTwoWay(),
        $(go.Shape, "RoundedRectangle",
          {
            fill: "white",
            stroke: "#e5e7eb",
            strokeWidth: 1,
          },
          new go.Binding("fill", "", () => this.darkMode ? "#374151" : "white"),
          new go.Binding("stroke", "", () => this.darkMode ? "#4b5563" : "#e5e7eb")
        ),
        $(go.Panel, "Table",
          { defaultAlignment: go.Spot.Left, margin: 12 },
          $(go.RowColumnDefinition, { row: 0, sizing: go.RowColumnDefinition.None }),

          // Header
          $(go.Panel, "Horizontal",
            {
              row: 0,
              alignment: go.Spot.Center,
              stretch: go.GraphObject.Horizontal,
              background: "#f3f4f6"
            },
            new go.Binding("background", "", () => this.darkMode ? "#1f2937" : "#f3f4f6"),
            $(go.TextBlock,
              {
                font: "600 16px Inter, system-ui, sans-serif",
                margin: new go.Margin(8, 8, 8, 8),
              },
              new go.Binding("text", "key"),
              new go.Binding("stroke", "", () => this.darkMode ? "#f3f4f6" : "#1f2937")
            )
          ),

          // Attributes list
          $(go.Panel, "Vertical",
            {
              name: "ATTRIBUTES",
              row: 1,
              margin: new go.Margin(8, 0, 0, 0),
              stretch: go.GraphObject.Horizontal,
              itemTemplate: itemTemplate,
              defaultAlignment: go.Spot.Left
            },
            new go.Binding("itemArray", "items")
          )
        )
      );

    this.diagram.linkTemplate =
      $(go.Link,
        {
          routing: go.Link.AvoidsNodes,
          curve: go.Link.JumpOver,
          corner: 10,
          selectionAdorned: true,
          fromEndSegmentLength: 50,
          toEndSegmentLength: 50,
        },
        $(go.Shape,
          {
            stroke: "#6b7280",
            strokeWidth: 2,
          },
          new go.Binding("stroke", "", () => this.darkMode ? "#4b5563" : "#6b7280")
        ),
        $(go.Shape,
          { toArrow: "Standard", stroke: null },
          new go.Binding("fill", "", () => this.darkMode ? "#4b5563" : "#6b7280")
        ),
        $(go.Panel, "Auto",
          {
            segmentOffset: new go.Point(0, -12)
          },
          $(go.Shape, "RoundedRectangle",
            {
              fill: this.darkMode ? "#374151" : "white",
              stroke: this.darkMode ? "#4b5563" : "#e5e7eb"
            }
          ),
          $(go.TextBlock,
            {
              text: "1",
              font: "600 12px Inter, system-ui, sans-serif",
              margin: 3
            },
            new go.Binding("text", "text"),
            new go.Binding("stroke", "", () => this.darkMode ? "#f3f4f6" : "#1f2937")
          )
        ),
        $(go.Panel, "Auto",
          {
            segmentOffset: new go.Point(0, -12),
            segmentIndex: -1
          },
          $(go.Shape, "RoundedRectangle",
            {
              fill: this.darkMode ? "#374151" : "white",
              stroke: this.darkMode ? "#4b5563" : "#e5e7eb"
            }
          ),
          $(go.TextBlock,
            {
              font: "600 12px Inter, system-ui, sans-serif",
              margin: 3
            },
            new go.Binding("text", "toText"),
            new go.Binding("stroke", "", () => this.darkMode ? "#f3f4f6" : "#1f2937")
          )
        )
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
    const hasPrimaryKey: boolean = entity.items.some((item: AttributeModel) : boolean => item.pk);
    if (!hasPrimaryKey) {
      console.log(`Entity ${entity.key} does not have a primary key and cannot be part of a relationship.`);
      return;
    }

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
