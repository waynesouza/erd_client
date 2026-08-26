import { Component, EventEmitter, Input, Output } from '@angular/core';
import { EntityModel } from '../../app/model/entity.model';

@Component({
  selector: 'app-entity-edit-form',
  template: ''
})
export class EntityEditFormStubComponent {
  @Input() entity: EntityModel | null = null;
  @Output() entityUpdated = new EventEmitter<EntityModel>();
  @Output() entityRemoved = new EventEmitter<string>();
  @Output() close = new EventEmitter<void>();
}
