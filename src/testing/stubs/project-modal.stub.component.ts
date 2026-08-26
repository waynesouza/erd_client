import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Project } from '../../app/model/project.model';

@Component({
  selector: 'app-project-modal',
  template: ''
})
export class ProjectModalStubComponent {
  @Input() isEditMode = false;
  @Input() projectToEdit: Project | null = null;
  @Output() modalClosed = new EventEmitter<boolean>();
  @Output() projectCreated = new EventEmitter<string>();
}
