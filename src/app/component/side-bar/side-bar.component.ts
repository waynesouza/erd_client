import { Component, EventEmitter, OnInit, Output, OnDestroy } from '@angular/core';
import { AuthService } from '../../service/auth.service';
import { Router } from '@angular/router';
import { ProjectService } from '../../service/project.service';
import { StorageService } from '../../service/storage.service';
import { SharedService } from '../../service/shared.service';
import { Subscription, Observable } from 'rxjs';
import { AuthResponseModel } from "../../model/auth-response.model";

interface UserResponse {
  name: string;
  email: string;
  avatar?: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
  // Add other project properties as needed
}

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

  openEditModal(project: Project, event: MouseEvent): void {
    event.stopPropagation();
    this.isEditMode = true;
    this.getProjectDataById(project.id);
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.buildProjectList();
  }

  setHoveredProject(projectId: string | null): void {
    this.hoveredProjectId = projectId;
  }

  getProjectDataById(id: string): void {
    this.subscription.add(
      this.projectService.getProjectById(id).subscribe(response => {
        if (response.body) {
          this.selectedProject = response.body as Project;
        }
      })
    );
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
}
