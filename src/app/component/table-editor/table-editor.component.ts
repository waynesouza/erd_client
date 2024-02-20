import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-table-editor',
  templateUrl: './table-editor.component.html',
  styleUrls: ['./table-editor.component.css']
})
export class TableEditorComponent {

  @Input() entity: any = {};
  @Output() onSave: EventEmitter<any> = new EventEmitter<any>();
  @Output() onClose: EventEmitter<any> = new EventEmitter<any>();

  addColumn() {
    console.log(this.entity);
    const newColumn = {
      name: '',
      type: ''
    }
    this.entity.items = [...this.entity.items, newColumn];
  }

  removeColumn(index: number) {
    this.entity.items.splice(index, 1);
  }

  saveTable() {
    this.onSave.emit(this.entity);
    this.closeTableEditor();
  }

  closeTableEditor() {
    this.onClose.emit();
  }

}
