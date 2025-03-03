import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { StorageService } from '../../../service/storage.service';
import { ProjectService } from '../../../service/project.service';
import { DiagramService } from '../../../service/diagram.service';

@Component({
  selector: 'app-project-modal',
  templateUrl: './project-modal.component.html',
  styleUrls: ['./project-modal.component.css']
})
export class ProjectModalComponent implements OnInit {
  @Input() isEditMode: boolean = false;
  @Input() projectToEdit: any = null;
  @Output() modalClosed = new EventEmitter<boolean>();

  modalTitle: string = 'Create Project';
  buttonText: string = 'Create';

  newProject: any = {
    name: '',
    description: '',
    userEmail: ''
  };

  editProject: any = {
    id: '',
    name: '',
    description: '',
    createdAt: ''
  };

  constructor(private diagramService: DiagramService, private projectService: ProjectService, private storageService: StorageService) { }

  ngOnInit(): void {
    if (this.isEditMode && this.projectToEdit) {
      this.modalTitle = 'Edit Project';
      this.buttonText = 'Update';
      this.editProject = { ...this.projectToEdit };
    }
  }

  closeModal(): void {
    this.newProject = {
      name: '',
      description: '',
      userEmail: ''
    };

    this.editProject = {
      id: '',
      name: '',
      description: '',
      createdAt: ''
    };

    this.modalClosed.emit(true);
  }

  submitForm(): void {
    if (this.isEditMode) {
      this.projectService.updateProject(this.editProject).subscribe(() => {
        this.closeModal();
      });
    } else {
      this.newProject.userEmail = this.storageService.getUser().email;
      this.projectService.createProject(this.newProject).subscribe(project => {
        const diagram = {
          // @ts-ignore
          projectId: project.id
        };
        this.diagramService.createDiagram(diagram).subscribe();
        this.closeModal();
      });
    }
  }

  get currentProject(): any {
    return this.isEditMode ? this.editProject : this.newProject;
  }

}
