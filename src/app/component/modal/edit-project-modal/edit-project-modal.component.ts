import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { EntityModel } from "../../../model/entity.model";
import { Point } from "gojs";

@Component({
  selector: 'app-edit-project-modal',
  templateUrl: './edit-project-modal.component.html',
  styleUrls: ['./edit-project-modal.component.css']
})
export class EditProjectModalComponent {

  @Input() project: any = {
    name: '',
    members: []
  };
  @Output() close: EventEmitter<void> = new EventEmitter<void>();


  closeModal(): void {
    this.close.emit();
  }

}
