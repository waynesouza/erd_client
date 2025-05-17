import { Component, EventEmitter, OnInit, Output, OnDestroy } from '@angular/core';
import { AuthService } from '../../service/auth.service';
import { Router } from '@angular/router';
import { ProjectService } from '../../service/project.service';
import { StorageService } from '../../service/storage.service';
import { SharedService } from '../../service/shared.service';
import { Subscription, Observable } from 'rxjs';
import { AuthResponseModel } from "../../model/auth-response.model";
import { Project } from "../../model/project.model";

interface UserResponse {
  name: string;
  email: string;
  avatar?: string;
}

// interface Project {
//   id: string;
//   name: string;
//   description?: string;
//   createdAt?: Date;
//   updatedAt?: Date;
//   // Add other project properties as needed
// }

@Component({
  selector: 'app-side-bar',
  templateUrl: './side-bar.component.html',
  styleUrls: ['./side-bar.component.scss']
})
export class SideBarComponent implements OnInit, OnDestroy {
  @Output() itemClicked: EventEmitter<string> = new EventEmitter<string>();
  @Output() sidebarCollapsed: EventEmitter<boolean> = new EventEmitter<boolean>();

  projects: Project[] = [];
  email: string = '';
  isModalOpen: boolean = false;
  hoveredProjectId: string | null = null;
  isEditMode: boolean = false;
  selectedProject: Project | null = null;
  isCollapsed: boolean = false;

  private subscription: Subscription = new Subscription();
  protected user: AuthResponseModel;
  userData$: Observable<UserResponse>;

  constructor(
    public authService: AuthService,
    public projectService: ProjectService,
    private storageService: StorageService,
    private router: Router,
    private sharedService: SharedService
  ) {
    this.user = this.storageService.getUser();
    this.userData$ = new Observable<UserResponse>();
  }

  ngOnInit(): void {
    this.buildProjectList();
  }

  logout(): void {
    this.authService.logout();
    void this.router.navigate(['/login']);
  }

  isLoginOrRegisterRoute(): boolean {
    const url: string = this.router.url;
    return url.includes('/login') || url.includes('/register');
  }

  buildProjectList(): void {
    this.subscription.add(
      // @ts-ignore
      this.projectService.getProjectsByUserEmail(this.user.email).subscribe((response: Project[]) => {
        this.projects = response;
      })
    );
  }

  loadProject(projectId: string): void {
    this.sharedService.changeProjectId(projectId);
  }

  openCreateModal(): void {
    this.isEditMode = false;
    this.selectedProject = null;
    this.isModalOpen = true;
  }

  async openEditModal(project: Project, event: MouseEvent): Promise<void> {
    event.stopPropagation();
    this.isEditMode = true;
    await this.getProjectDataById(project.id);
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.buildProjectList();
  }

  setHoveredProject(projectId: string | null): void {
    this.hoveredProjectId = projectId;
  }

  async getProjectDataById(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.subscription.add(
        this.projectService.getProjectById(id).subscribe({
          next: (response) => {
            if (response) {
              // @ts-ignore
              this.selectedProject = response;
            }
            resolve();
          },
          error: (err) => {
            console.error('Erro ao buscar dados do projeto:', err);
            reject(err);
          }
        })
      );
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
    this.sidebarCollapsed.emit(this.isCollapsed);
  }

  handleUserResponse(response: UserResponse): void {
    // Handle user response
  }

  handleLogoutResponse(response: { success: boolean }): void {
    if (response.success) {
      void this.router.navigate(['/login']);
    }
  }

  isOwnerOfSelectedProject(): boolean {
    if (!this.selectedProject || !this.user) {
      return false;
    }
    return this.selectedProject.usersDto.some(
      member => member.email === this.user.email && member.role === 'OWNER'
    );
  }

  deleteSelectedProject(): void {
    if (!this.selectedProject) {
      return;
    }
    if (!this.isOwnerOfSelectedProject()) {
      alert('Only the project owner can delete this project.');
      return;
    }
    if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      this.projectService.deleteProject(this.selectedProject.id).subscribe({
        next: () => {
          this.selectedProject = null;
          this.buildProjectList();
        },
        error: (error: any) => {
          console.error('Error deleting project:', error);
          alert('Failed to delete project. Please try again.');
        }
      });
    }
  }
}
