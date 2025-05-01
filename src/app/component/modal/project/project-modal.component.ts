import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { StorageService } from '../../../service/storage.service';
import { ProjectService } from '../../../service/project.service';
import { DiagramService } from '../../../service/diagram.service';
import { Project, ProjectUser, CreateProjectDto, UpdateProjectDto } from '../../../model/project.model';

@Component({
  selector: 'app-project-modal',
  templateUrl: './project-modal.component.html',
  styleUrls: ['./project-modal.component.css']
})
export class ProjectModalComponent implements OnInit {
  @Input() isEditMode: boolean = false;
  @Input() projectToEdit: Project | null = null;
  @Output() modalClosed = new EventEmitter<boolean>();

  currentUser: ProjectUser;
  showAddMemberModal = false;
  newMemberEmail = '';

  newProject: CreateProjectDto = {
    name: '',
    description: '',
    userEmail: ''
  };

  editProject: UpdateProjectDto = {
    id: '',
    name: '',
    description: ''
  };

  constructor(
    private diagramService: DiagramService,
    private projectService: ProjectService,
    private storageService: StorageService
  ) {
    this.currentUser = this.storageService.getUser();
  }

  ngOnInit(): void {
    console.log(this.projectToEdit);
    if (this.isEditMode && this.projectToEdit) {
      this.editProject = {
        id: this.projectToEdit.id,
        name: this.projectToEdit.name,
        description: this.projectToEdit.description
      };
    }
  }

  closeModal(): void {
    this.resetForm();
    this.modalClosed.emit(true);
  }

  submitForm(): void {
    if (!this.validateForm()) {
      return;
    }

    if (this.isEditMode) {
      this.updateProject();
    } else {
      this.createProject();
    }
  }

  get currentProject(): CreateProjectDto | UpdateProjectDto {
    return this.isEditMode ? this.editProject : this.newProject;
  }

  canManageMembers(): boolean {
    if (!this.currentUser || !this.projectToEdit) {
      return false;
    }

    const currentMember = this.projectToEdit.usersDto.find(
      member => member.id === this.currentUser.id
    );

    if (!currentMember) {
      return false;
    }

    return ['OWNER', 'EDITOR'].includes(currentMember.role);
  }

  canRemoveMember(member: ProjectUser): boolean {
    if (!this.canManageMembers()) {
      return false;
    }

    const currentMember = this.projectToEdit?.usersDto.find(
      m => m.id === this.currentUser.id
    );

    if (currentMember?.role === 'EDITOR' && member.role === 'OWNER') {
      return false;
    }

    return member.id !== this.currentUser.id;
  }

  removeMember(memberId: string): void {
    if (!this.canManageMembers() || !this.projectToEdit) {
      return;
    }

    if (confirm('Are you sure you want to remove this member from the project?')) {
      // this.projectService.removeMember(this.projectToEdit.id, memberId).subscribe({
      //   next: () => {
      //     if (this.projectToEdit) {
      //       this.projectToEdit.usersDto = this.projectToEdit.usersDto.filter(
      //         member => member.id !== memberId
      //       );
      //     }
      //   },
      //   error: (error) => {
      //     console.error('Error removing member:', error);
      //     alert('Failed to remove member. Please try again.');
      //   }
      // });
    }
  }

  openAddMemberModal(): void {
    this.showAddMemberModal = true;
  }

  addMember(): void {
    if (!this.newMemberEmail || !this.projectToEdit) {
      return;
    }

    // this.projectService.addMember(this.projectToEdit.id, this.newMemberEmail).subscribe({
    //   next: (newMember: ProjectUser) => {
    //     if (this.projectToEdit) {
    //       this.projectToEdit.usersDto.push(newMember);
    //     }
    //     this.showAddMemberModal = false;
    //     this.newMemberEmail = '';
    //   },
    //   error: (error) => {
    //     console.error('Error adding member:', error);
    //     alert('Failed to add member. Please check the email and try again.');
    //   }
    // });
  }

  private validateForm(): boolean {
    if (!this.currentProject.name.trim()) {
      alert('Project name is required');
      return false;
    }

    if (!this.currentProject.description.trim()) {
      alert('Project description is required');
      return false;
    }

    return true;
  }

  private resetForm(): void {
    this.newProject = {
      name: '',
      description: '',
      userEmail: ''
    };

    this.editProject = {
      id: '',
      name: '',
      description: ''
    };

    this.showAddMemberModal = false;
    this.newMemberEmail = '';
  }

  private createProject(): void {
    this.newProject.userEmail = this.currentUser.email;

    // @ts-ignore
    this.projectService.createProject(this.newProject).subscribe({
      next: (project: Project) => {
        const diagram = {
          projectId: project.id
        };
        this.diagramService.createDiagram(diagram).subscribe({
          next: () => this.closeModal(),
          error: (error) => {
            console.error('Error creating diagram:', error);
            alert('Project created but failed to create diagram. Please try again.');
          }
        });
      },
      error: (error) => {
        console.error('Error creating project:', error);
        alert('Failed to create project. Please try again.');
      }
    });
  }

  private updateProject(): void {
    this.projectService.updateProject(this.editProject).subscribe({
      next: () => this.closeModal(),
      error: (error) => {
        console.error('Error updating project:', error);
        alert('Failed to update project. Please try again.');
      }
    });
  }
}
