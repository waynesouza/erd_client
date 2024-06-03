import { Component, EventEmitter, Input, Output } from '@angular/core';
import { EntityModel } from '../../model/entity.model';
import { Point } from 'gojs';
import { DataType } from "../../model/enum/datatype.enum";

@Component({
  selector: 'app-entity-edit-form',
  templateUrl: './entity-edit-form.component.html',
  styleUrls: ['./entity-edit-form.component.css']
})
export class EntityEditFormComponent {

  @Input() entity: EntityModel = {
    id: '',
    key: '',
    items: [],
    location: new Point(0, 0)
  };
  @Output() entityUpdated: EventEmitter<EntityModel> = new EventEmitter<EntityModel>();
  @Output() entityRemoved: EventEmitter<string> = new EventEmitter<string>();
  @Output() close: EventEmitter<void> = new EventEmitter<void>();
  dataTypes: DataType[] = Object.values(DataType);

  addAttribute(): void {
    this.entity.items.push({ name: '', type: null, pk: false, fk: false, unique: false, defaultValue: '', nullable: false, autoIncrement: false });
  }

  removeAttribute(index: number): void {
    this.entity.items.splice(index, 1);

  }

  updateEntity(): void {
    this.entityUpdated.emit(this.entity);
    this.closeModal();
  }

  closeModal(): void {
    this.close.emit();
  }

}
