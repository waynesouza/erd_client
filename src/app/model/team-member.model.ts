export interface TeamMember {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'OWNER' | 'EDITOR' | 'VIEWER';
}

export interface AddTeamMemberDto {
  projectId: string;
  userEmail: string;
  roleProjectEnum: 'OWNER' | 'EDITOR' | 'VIEWER';
}

export interface UpdateTeamMemberDto {
  userId: string;
  projectId: string;
  role: 'OWNER' | 'EDITOR' | 'VIEWER';
}
