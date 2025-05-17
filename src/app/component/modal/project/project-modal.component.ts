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

  currentUser: ProjectUser | null = null;
  showAddMemberModal = false;
  newMemberEmail = '';
  newMemberRole: 'EDITOR' | 'VIEWER' = 'VIEWER';

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
  ) {}

  ngOnInit(): void {
    const user = this.storageService.getUser();
    if (!user) {
      console.error('No user found in storage');
      this.closeModal();
      return;
    }
    this.currentUser = user;

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

  isOwner(): boolean {
    if (!this.currentUser || !this.projectToEdit) {
      return false;
    }

    const currentMember = this.projectToEdit.usersDto.find(
      member => member.id === this.currentUser?.id
    );

    return currentMember?.role === 'OWNER';
  }

  canManageMembers(): boolean {
    return this.isOwner();
  }

  canRemoveMember(member: ProjectUser): boolean {
    if (!this.isOwner() || !this.currentUser) {
      return false;
    }

    // Não pode remover a si mesmo
    if (member.id === this.currentUser.id) {
      return false;
    }

    // Não pode remover outro OWNER
    if (member.role === 'OWNER') {
      return false;
    }

    return true;
  }

  removeMember(memberId: string): void {
    if (!this.isOwner() || !this.projectToEdit) {
      return;
    }

    const memberToRemove = this.projectToEdit.usersDto.find(m => m.id === memberId);
    if (!memberToRemove) {
      return;
    }

    if (!this.canRemoveMember(memberToRemove)) {
      alert('You cannot remove this member.');
      return;
    }

    if (confirm('Are you sure you want to remove this member from the project?')) {
      this.projectService.removeTeamMember(memberId, this.projectToEdit.id).subscribe({
        next: () => {
          if (this.projectToEdit) {
            this.projectToEdit.usersDto = this.projectToEdit.usersDto.filter(
              member => member.id !== memberId
            );
          }
        },
        error: (error: any) => {
          console.error('Error removing member:', error);
          alert('Failed to remove member. Please try again.');
        }
      });
    }
  }

  openAddMemberModal(): void {
    this.showAddMemberModal = true;
  }

  addMember(): void {
    if (!this.newMemberEmail || !this.projectToEdit) {
      return;
    }

    const teamMember = {
      projectId: this.projectToEdit.id,
      userEmail: this.newMemberEmail,
      role: this.newMemberRole
    };

    this.projectService.addTeamMember(teamMember).subscribe({
      next: (response: any) => {
        if (this.projectToEdit && response.body) {
          this.projectToEdit.usersDto.push(response.body);
        }
        this.showAddMemberModal = false;
        this.newMemberEmail = '';
        this.newMemberRole = 'VIEWER';
      },
      error: (error: any) => {
        console.error('Error adding member:', error);
        alert('Failed to add member. Please check the email and try again.');
      }
    });
  }

  updateMemberRole(member: ProjectUser, newRole: 'OWNER' | 'EDITOR' | 'VIEWER'): void {
    if (!this.isOwner() || !this.projectToEdit) {
      return;
    }

    // Não pode mudar o papel de si mesmo
    if (member.id === this.currentUser?.id) {
      return;
    }

    const updateTeamMember = {
      projectId: this.projectToEdit.id,
      userId: member.id,
      role: newRole
    };

    this.projectService.updateTeamMember(updateTeamMember).subscribe({
      next: (response: any) => {
        if (this.projectToEdit && response.body) {
          const index = this.projectToEdit.usersDto.findIndex(m => m.id === member.id);
          if (index !== -1) {
            this.projectToEdit.usersDto[index] = response.body;
          }
        }
      },
      error: (error: any) => {
        console.error('Error updating member role:', error);
        alert('Failed to update member role. Please try again.');
      }
    });
  }

  deleteProject(): void {
    if (!this.isOwner() || !this.projectToEdit) {
      return;
    }

    if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      this.projectService.deleteProject(this.projectToEdit.id).subscribe({
        next: () => {
          this.closeModal();
        },
        error: (error: any) => {
          console.error('Error deleting project:', error);
          alert('Failed to delete project. Please try again.');
        }
      });
    }
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
    this.newMemberRole = 'VIEWER';
  }

  private createProject(): void {
    if (!this.currentUser) {
      console.error('No user found');
      return;
    }

    this.newProject.userEmail = this.currentUser.email;

    this.projectService.createProject(this.newProject).subscribe({
      next: (response: any) => {
        if (response.body) {
          const diagram = {
            projectId: response.body.id
          };
          this.diagramService.createDiagram(diagram).subscribe({
            next: () => this.closeModal(),
            error: (error: any) => {
              console.error('Error creating diagram:', error);
              alert('Project created but failed to create diagram. Please try again.');
            }
          });
        }
      },
      error: (error: any) => {
        console.error('Error creating project:', error);
        alert('Failed to create project. Please try again.');
      }
    });
  }

  private updateProject(): void {
    this.projectService.updateProject(this.editProject).subscribe({
      next: () => this.closeModal(),
      error: (error: any) => {
        console.error('Error updating project:', error);
        alert('Failed to update project. Please try again.');
      }
    });
  }

}
