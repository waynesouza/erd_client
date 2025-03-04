import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { StorageService } from '../../../service/storage.service';
import { ProjectService } from '../../../service/project.service';
import { DiagramService } from '../../../service/diagram.service';
import { AuthService } from "../../../service/auth.service";

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

  currentUser: any = {};

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
    this.currentUser = this.storageService.getUser();

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
      createdAt: '',
      usersDto: []
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

  canManageMembers(): boolean {
    if (!this.currentUser || !this.projectToEdit) return false;

    // @ts-ignore
    const currentMember = this.projectToEdit.usersDto.find(member => member.id === this.currentUser.id);

    if (!currentMember) return false;

    return ['OWNER', 'EDITOR'].includes(currentMember.role);
  }

  canRemoveMember(member: any): boolean {
    if (!this.canManageMembers()) return false;

    // @ts-ignore
    const currentMember = this.projectToEdit.usersDto.find(member => member.id === this.currentUser.id);

    if (currentMember.role === 'EDITOR' && member.role === 'OWNER') {
      return false;
    }

    return member.id !== this.currentUser.id;
  }

  removeMember(memberId: string) : void {
    if (!this.canManageMembers()) return;

    // TODO Remove member
    // if (confirm('Are you sure you want to remove this member from the project?')) {
    //   this.projectService.removeMember(this.projectToEdit.id, memberId).subscribe(() : void => {
    //       // @ts-ignore
    //       this.projectToEdit.members = this.projectToEdit.usersDto.filter(member => member.id !== memberId);
    //     }
    //   );
    // }
  }

}
