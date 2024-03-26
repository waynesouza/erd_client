import { Component, EventEmitter, Input, Output } from '@angular/core';
import { EntityModel } from "../../model/entity.model";
import { Point } from 'gojs';

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
  @Output() entityUpdated = new EventEmitter<EntityModel>();
  @Output() formClosed = new EventEmitter<void>();

  addAttribute() {
    this.entity.items.push({ name: '', type: '', pk: false, unique: false, defaultValue: '', nullable: false, autoIncrement: false });
  }

  updateEntity(): void {
    this.entityUpdated.emit(this.entity);
  }

  closeForm(): void {
    this.formClosed.emit();
  }

}
