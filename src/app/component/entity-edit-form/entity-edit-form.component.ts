import { Component, EventEmitter, Input, Output } from '@angular/core';
import { EntityModel } from '../../model/entity.model';
import { Point } from 'gojs';
import { DataType } from "../../model/enum/datatype.enum";
import { AttributeModel } from '../../model/attribute.model';

@Component({
  selector: 'app-entity-edit-form',
  templateUrl: './entity-edit-form.component.html',
  styleUrls: ['./entity-edit-form.component.scss']
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
    const newAttribute: AttributeModel = {
      name: '',
      type: DataType.VARCHAR,
      pk: false,
      fk: false,
      unique: false,
      defaultValue: '',
      nullable: true,
      autoIncrement: false
    };
    
    this.entity.items.push(newAttribute);
  }

  removeAttribute(index: number): void {
    if (confirm('Are you sure you want to remove this attribute?')) {
      this.entity.items.splice(index, 1);
    }
  }

  updateEntity(): void {
    if (this.validateEntity()) {
      this.entityUpdated.emit(this.entity);
      this.closeModal();
    }
  }

  private validateEntity(): boolean {
    if (!this.entity.key || this.entity.key.trim() === '') {
      alert('Please enter an entity name.');
      return false;
    }

    // Check for duplicate attribute names
    const attributeNames = this.entity.items.map(item => item.name.toLowerCase());
    const duplicates = attributeNames.filter((name, index) => attributeNames.indexOf(name) !== index);
    
    if (duplicates.length > 0) {
      alert('Duplicate attribute names are not allowed.');
      return false;
    }

    // Check for empty attribute names
    const emptyNames = this.entity.items.some(item => !item.name || item.name.trim() === '');
    if (emptyNames) {
      alert('All attributes must have a name.');
      return false;
    }

    // Check for missing types
    const missingTypes = this.entity.items.some(item => !item.type);
    if (missingTypes) {
      alert('All attributes must have a type.');
      return false;
    }

    return true;
  }

  closeModal(): void {
    this.close.emit();
  }

}
