import {Component, Input, OnInit} from '@angular/core';
import * as go from 'gojs';

const $ = go.GraphObject.make;

@Component({
  selector: 'app-diagram',
  templateUrl: './diagram.component.html',
  styleUrls: ['./diagram.component.css']
})
export class DiagramComponent implements OnInit {

  @Input() entities: any[] = [];
  relationships: any[] = [];
  darkMode: boolean = false;
  showTableEditor: boolean = false;
  selectedEntity: any = {};
  selectedRelationshipType: '1:1' | '1:n' | 'n:n' | null = null;
  selectedEntities: any[] = [];
  // @ts-ignore
  public diagram: go.Diagram = null;

  constructor() {
  }

  ngOnInit(): void {
    this.initializeDiagram();
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
        // reshapable: true,
        corner: 5,
        layerName: 'Background',
        isShadowed: true,
        shadowColor: '#919cab',
        shadowOffset: new go.Point(2, 2),
        routing: go.Link.AvoidsNodes
      },
      $(go.Shape,  // the link shape
        {stroke: "#f7f9fc", strokeWidth: 4}),
      $(go.Panel, "Auto", {segmentIndex: 0, segmentOffset: new go.Point(22, 0)},
        $(go.Shape, "RoundedRectangle", {fill: "#f7f9fc"}, {stroke: "#eeeeee"}),
        $(go.TextBlock,  // the "from" label
          {
            textAlign: "center",
            font: "bold 14px sans-serif",
            stroke: "black",
            background: "#f7f9fc",
            segmentOffset: new go.Point(NaN, NaN),
            segmentOrientation: go.Link.OrientUpright
          },
          new go.Binding("text", "text"))),
      $(go.Panel, "Auto",
        {
          segmentIndex: -1,
          segmentOffset: new go.Point(-13, 0)
        },
        $(go.Shape, "RoundedRectangle", {fill: "#edf6fc"}, {stroke: "#eeeeee"}),
        $(go.TextBlock,  // the "to" label
          {
            textAlign: "center",
            font: "bold 14px sans-serif",
            stroke: "black",
            segmentIndex: -1,
            segmentOffset: new go.Point(NaN, NaN),
            segmentOrientation: go.Link.OrientUpright
          },
          new go.Binding("text", "toText")))
    );

    this.diagram.nodeTemplate.doubleClick = (e, node) => {
      // @ts-ignore
      const clickedNode = node.part.data;
      this.showTableEditorModal(clickedNode);
    }
  }

  toggleDarkMode(): void {
    this.darkMode = !this.darkMode;
  }

  addEntity(): void {
    const newEntity = {
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

  showTableEditorModal(entity: any): void {
    this.selectedEntity = entity;
    this.showTableEditor = true;
  }

  handleSave(entity: any): void {
    this.showTableEditor = false;
    const index = this.entities.findIndex(e => e.id === entity.id);
    this.entities[index].items = entity.items;
    this.diagram.model = new go.GraphLinksModel({
      nodeDataArray: this.entities,
      linkDataArray: this.relationships
    });
  }

  handleClose(): void {
    this.showTableEditor = false;
  }

  selectRelationshipType(type: '1:1' | '1:n' | 'n:n'): void {
    this.selectedRelationshipType = type;
    this.selectedEntities = [];
  }

  entityClicked(entity: any): void {
    console.log(this.selectedEntities);

    if (this.selectedRelationshipType && this.selectedEntities.length < 2) {
      this.selectedEntities.push(entity);
    }
    if (this.selectedEntities.length === 2) {
      const linkData = {
        from: this.selectedEntities[0].key,
        to: this.selectedEntities[1].key,
        text: this.selectedRelationshipType,
        toText: 1,
      };

      this.createRelationship(linkData);
      this.selectedRelationshipType = null;
    }
  }

  createRelationship(linkData: any): void {
    this.relationships.push(linkData);
    this.remakeDiagram();
    console.log(this.relationships);
    this.selectedEntities = [];
  }

  removeRelationship(): void {
    this.relationships.pop();
    this.remakeDiagram();
  }

  remakeDiagram(): void {
    this.diagram.model = new go.GraphLinksModel({
      nodeDataArray: this.entities,
      linkDataArray: this.relationships
    });
  }

}
