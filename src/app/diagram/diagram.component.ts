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
  darkMode: boolean = false;
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

    const itemTempl = $(go.Panel, 'Horizontal',
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
        shadowColor: '#919cab'
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
              itemTemplate: itemTempl,
              row: 1
            },
            new go.Binding('itemArray', 'items')),
        )
      ),
    )
  }

  toggleDarkMode(): void {
    this.darkMode = !this.darkMode;
  }

  addEntity(): void {
    const newEntity = {
      key: `Entity ${this.entities.length + 1}`,
      items: [],
      location: new go.Point(Math.random() * 400, Math.random() * 400)
    };

    this.entities.push(newEntity);
    this.diagram.model = new go.GraphLinksModel({
      nodeDataArray: this.entities
    });
  }

}
