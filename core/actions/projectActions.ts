import { ProjectConfig, ProjectManagerState } from '../types';

// 项目管理的 Action Types
export type ProjectActionType =
  | "LOAD_PROJECTS"
  | "SET_CURRENT_PROJECT"
  | "ADD_PROJECT"
  | "UPDATE_PROJECT"
  | "DELETE_PROJECT"
  | "ADD_RECENT_PROJECT"
  | "CREATE_PROJECT"
  | "SWITCH_PROJECT"
  | "SAVE_CURRENT_SCENE"
  | "LOAD_PROJECT_SCENES";

// 项目管理 Actions
export interface LoadProjectsAction {
  type: "LOAD_PROJECTS";
  payload: {
    projects: { [projectId: string]: ProjectConfig };
  };
}

export interface SetCurrentProjectAction {
  type: "SET_CURRENT_PROJECT";
  payload: {
    projectId: string | null;
  };
}

export interface AddProjectAction {
  type: "ADD_PROJECT";
  payload: {
    project: ProjectConfig;
  };
}

export interface UpdateProjectAction {
  type: "UPDATE_PROJECT";
  payload: {
    projectId: string;
    updates: Partial<ProjectConfig>;
  };
}

export interface DeleteProjectAction {
  type: "DELETE_PROJECT";
  payload: {
    projectId: string;
  };
}

export interface AddRecentProjectAction {
  type: "ADD_RECENT_PROJECT";
  payload: {
    projectId: string;
  };
}

export interface CreateProjectAction {
  type: "CREATE_PROJECT";
  payload: {
    project: ProjectConfig;
  };
}

export interface SwitchProjectAction {
  type: "SWITCH_PROJECT";
  payload: {
    projectId: string;
  };
}

export interface SaveCurrentSceneAction {
  type: "SAVE_CURRENT_SCENE";
  payload?: void;
}

export interface LoadProjectScenesAction {
  type: "LOAD_PROJECT_SCENES";
  payload: {
    projectId: string;
  };
}

export type ProjectAction =
  | LoadProjectsAction
  | SetCurrentProjectAction
  | AddProjectAction
  | UpdateProjectAction
  | DeleteProjectAction
  | AddRecentProjectAction
  | CreateProjectAction
  | SwitchProjectAction
  | SaveCurrentSceneAction
  | LoadProjectScenesAction;

// Action Creators
export const loadProjects = (projects: { [projectId: string]: ProjectConfig }): LoadProjectsAction => ({
  type: "LOAD_PROJECTS",
  payload: { projects },
});

export const setCurrentProject = (projectId: string | null): SetCurrentProjectAction => ({
  type: "SET_CURRENT_PROJECT",
  payload: { projectId },
});

export const addProject = (project: ProjectConfig): AddProjectAction => ({
  type: "ADD_PROJECT",
  payload: { project },
});

export const updateProject = (projectId: string, updates: Partial<ProjectConfig>): UpdateProjectAction => ({
  type: "UPDATE_PROJECT",
  payload: { projectId, updates },
});

export const deleteProject = (projectId: string): DeleteProjectAction => ({
  type: "DELETE_PROJECT",
  payload: { projectId },
});

export const addRecentProject = (projectId: string): AddRecentProjectAction => ({
  type: "ADD_RECENT_PROJECT",
  payload: { projectId },
});

export const createProject = (project: ProjectConfig): CreateProjectAction => ({
  type: "CREATE_PROJECT",
  payload: { project },
});

export const switchProject = (projectId: string): SwitchProjectAction => ({
  type: "SWITCH_PROJECT",
  payload: { projectId },
});

export const saveCurrentScene = (): SaveCurrentSceneAction => ({
  type: "SAVE_CURRENT_SCENE",
});

export const loadProjectScenes = (projectId: string): LoadProjectScenesAction => ({
  type: "LOAD_PROJECT_SCENES",
  payload: { projectId },
});
