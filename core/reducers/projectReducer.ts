import { ProjectManagerState } from '../types';
import { ProjectAction } from '../actions/projectActions';

const initialProjectState: ProjectManagerState = {
  projects: {},
  currentProjectId: null,
  recentProjects: [],
  projectTemplates: [],
};

export function projectReducer(
  state: ProjectManagerState = initialProjectState,
  action: ProjectAction
): ProjectManagerState {
  switch (action.type) {
    case "LOAD_PROJECTS":
      return {
        ...state,
        projects: action.payload.projects,
      };

    case "SET_CURRENT_PROJECT":
      return {
        ...state,
        currentProjectId: action.payload.projectId,
      };

    case "ADD_PROJECT":
      return {
        ...state,
        projects: {
          ...state.projects,
          [action.payload.project.id]: action.payload.project,
        },
      };

    case "UPDATE_PROJECT": {
      const { projectId, updates } = action.payload;
      if (!state.projects[projectId]) {
        return state;
      }

      return {
        ...state,
        projects: {
          ...state.projects,
          [projectId]: {
            ...state.projects[projectId],
            ...updates,
            lastModified: Date.now(),
          },
        },
      };
    }

    case "DELETE_PROJECT": {
      const newProjects = { ...state.projects };
      delete newProjects[action.payload.projectId];

      return {
        ...state,
        projects: newProjects,
        currentProjectId: state.currentProjectId === action.payload.projectId
          ? null
          : state.currentProjectId,
        recentProjects: state.recentProjects.filter(id => id !== action.payload.projectId),
      };
    }

    case "ADD_RECENT_PROJECT": {
      const projectId = action.payload.projectId;
      const newRecentProjects = [
        projectId,
        ...state.recentProjects.filter(id => id !== projectId),
      ].slice(0, 10); // 只保留最近的10个项目

      return {
        ...state,
        recentProjects: newRecentProjects,
      };
    }

    default:
      return state;
  }
}
