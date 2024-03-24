import { Component } from '@angular/core';
import { StorageService } from '../../../service/storage.service';
import { ProjectService } from '../../../service/project.service';
import { DiagramService } from '../../../service/diagram.service';

@Component({
  selector: 'app-create-project-modal',
  templateUrl: './create-project-modal.component.html',
  styleUrls: ['./create-project-modal.component.css']
})
export class CreateProjectModalComponent {

  project: any = {
    name: '',
    description: '',
    userEmail: ''
  };

  constructor(private diagramService: DiagramService, private projectService: ProjectService,
              private storageService: StorageService) { }

  closeModal(): void {
    this.project = {
      name: '',
      description: '',
      userEmail: ''
    };
  }

  submitForm(): void {
    this.project.userEmail = this.storageService.getUser().email;
    this.projectService.createProject(this.project).subscribe(project => {
      const diagram = {
        // @ts-ignore
        projectId: project.id
      };
      this.diagramService.createDiagram(diagram).subscribe();
    });
    this.closeModal();
  }

}
