import { SceneData } from '../core/types';
import ResourceManager from '../core/resources/ResourceManager';
/**
 * 游戏打包构建器
 * 将编辑器场景数据转换为可运行的游戏包
 */
export declare class GameBuilder {
    private sceneData;
    private resourceManager;
    private outputDir;
    constructor(scenes: SceneData[], resourceManager: ResourceManager, outputDir?: string);
    /**
     * 构建 H5 游戏
     */
    buildH5Game(): Promise<any>;
    /**
     * 构建微信小游戏
     */
    buildWechatGame(): Promise<any>;
    /**
     * 生成游戏运行时代码
     */
    private generateGameRuntime;
    /**
     * 生成场景数据文件
     */
    private generateSceneDataFile;
    /**
     * 生成 HTML 模板
     */
    private generateHTMLTemplate;
    /**
     * 生成微信小游戏配置
     */
    private generateWechatGameConfig;
    /**
     * 生成微信适配器
     */
    private generateWechatAdapter;
    /**
     * 生成构建配置
     */
    private generateBuildConfig;
    /**
     * 复制资源文件
     */
    private copyResources;
}
export default GameBuilder;
