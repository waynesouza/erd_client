export interface ProjectUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'OWNER' | 'EDITOR' | 'VIEWER';
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt?: string;
  usersDto: ProjectUser[];
}

export interface CreateProjectDto {
  name: string;
  description: string;
  userEmail: string;
}

export interface UpdateProjectDto {
  id: string;
  name: string;
  description: string;
}
