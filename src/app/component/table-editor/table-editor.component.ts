import { Component, EventEmitter, Input, Output } from '@angular/core';
import { EntityModel } from '../../model/entity.model';
import { AttributeModel } from '../../model/attribute.model';
import { DataType } from '../../model/enum/datatype.enum';

@Component({
  selector: 'app-table-editor',
  templateUrl: './table-editor.component.html',
  styleUrls: ['./table-editor.component.css']
})
export class TableEditorComponent {
  @Input() entity: EntityModel;
  @Output() onSave: EventEmitter<EntityModel> = new EventEmitter<EntityModel>();
  @Output() onClose: EventEmitter<void> = new EventEmitter<void>();

  dataTypes: DataType[] = Object.values(DataType);

  constructor() {
    this.entity = {
      id: '',
      key: '',
      items: [],
      // @ts-ignore
      location: { x: 0, y: 0 }
    };
  }

  addColumn(): void {
    const newColumn: AttributeModel = {
      name: '',
      type: DataType.VARCHAR,
      pk: false,
      fk: false,
      unique: false,
      nullable: true,
      autoIncrement: false,
      defaultValue: ''
    };

    this.entity.items = [...this.entity.items, newColumn];
  }

  removeColumn(index: number): void {
    this.entity.items = this.entity.items.filter((_, i) => i !== index);
  }

  saveTable(): void {
    if (this.validateTable()) {
      this.onSave.emit(this.entity);
      this.closeTableEditor();
    }
  }

  closeTableEditor(): void {
    this.onClose.emit();
  }

  private validateTable(): boolean {
    // Validar nome da tabela
    if (!this.entity.key.trim()) {
      alert('Table name is required');
      return false;
    }

    // Validar colunas
    if (this.entity.items.length === 0) {
      alert('At least one column is required');
      return false;
    }

    // Validar nome e tipo das colunas
    for (const column of this.entity.items) {
      if (!column.name.trim()) {
        alert('All columns must have a name');
        return false;
      }
    }

    // Validar chave primária
    const primaryKeys = this.entity.items.filter(column => column.pk);
    if (primaryKeys.length === 0) {
      alert('At least one primary key is required');
      return false;
    }

    return true;
  }
}
