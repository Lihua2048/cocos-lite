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

    case "CREATE_PROJECT": {
      const projectId = action.payload.project.id;
      const defaultSceneId = `${projectId}-scene`;

      // 为新项目创建默认场景配置
      const defaultSceneConfig = {
        id: defaultSceneId,
        name: '主场景',
        type: 'main' as const,
        layer: {
          id: 'main-layer',
          name: '主层',
          zIndex: 0,
          persistent: false,
          visible: true,
          opacity: 1
        },
        dependencies: [],
        loadPriority: 0,
        renderMode: 'switch' as const,
        state: 'unloaded' as const,
        lastModified: Date.now(),
        data: {
          id: defaultSceneId,
          name: '主场景',
          entities: {},
          animations: {},
          metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            entityCount: 0
          }
        }
      };

      return {
        ...state,
        currentProjectId: projectId, // 创建新项目后立即切换到新项目
        projects: {
          ...state.projects,
          [projectId]: {
            ...action.payload.project,
            created: Date.now(),
            lastModified: Date.now(),
            scenes: {
              [defaultSceneId]: defaultSceneConfig
            },
            sceneGraph: {
              ...action.payload.project.sceneGraph,
              currentScene: defaultSceneId,
              initialScene: defaultSceneId,
            },
          },
        },
      };
    }

    case "SWITCH_PROJECT":
      return {
        ...state,
        currentProjectId: action.payload.projectId,
        recentProjects: [
          action.payload.projectId,
          ...state.recentProjects.filter(id => id !== action.payload.projectId),
        ].slice(0, 10),
      };

    case "SAVE_CURRENT_SCENE":
      // 这个action主要用于触发场景保存，不需要直接修改project state
      // 但可以更新项目的最后修改时间
      if (state.currentProjectId && state.projects[state.currentProjectId]) {
        return {
          ...state,
          projects: {
            ...state.projects,
            [state.currentProjectId]: {
              ...state.projects[state.currentProjectId],
              lastModified: Date.now(),
            },
          },
        };
      }
      return state;

    case "LOAD_PROJECT_SCENES":
      // 这个action主要用于触发场景加载，不需要直接修改project state
      return state;

    default:
      return state;
  }
}
