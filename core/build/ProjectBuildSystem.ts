/**
 * 项目级构建系统 - 第二期核心功能
 * 支持完整的项目构建流程，包括多场景打包、资源优化、平台适配等
 */

export enum BuildPlatform {
  WEB = 'web',
  ANDROID = 'android',
  IOS = 'ios',
  DESKTOP = 'desktop',
  MINI_GAME = 'miniGame'
}

export enum BuildMode {
  DEBUG = 'debug',
  RELEASE = 'release',
  PROFILE = 'profile'
}

export enum AssetOptimization {
  NONE = 'none',
  BASIC = 'basic',
  AGGRESSIVE = 'aggressive'
}

export interface BuildConfig {
  projectId: string;
  projectName: string;
  version: string;
  platform: BuildPlatform;
  mode: BuildMode;
  outputPath: string;
  optimization: AssetOptimization;

  // 场景配置
  scenes: {
    id: string;
    include: boolean;
    order: number;
  }[];

  // 资源配置
  assets: {
    compress: boolean;
    format: string;
    quality: number;
  };

  // 代码配置
  code: {
    minify: boolean;
    obfuscate: boolean;
    sourceMap: boolean;
  };

  // 平台特定配置
  platformConfig: Record<string, any>;
}

export interface BuildResult {
  success: boolean;
  buildId: string;
  duration: number;
  outputFiles: BuildFile[];
  errors: BuildError[];
  warnings: BuildWarning[];
  stats: BuildStats;
}

export interface BuildFile {
  path: string;
  size: number;
  type: 'js' | 'css' | 'html' | 'asset' | 'manifest';
  compressed: boolean;
}

export interface BuildError {
  file: string;
  line: number;
  column: number;
  message: string;
  type: 'syntax' | 'type' | 'runtime' | 'asset';
}

export interface BuildWarning {
  file: string;
  message: string;
  type: 'performance' | 'compatibility' | 'deprecation';
}

export interface BuildStats {
  totalSize: number;
  compressedSize: number;
  assetCount: number;
  sceneCount: number;
  buildTime: number;
  compressionRatio: number;
}

export class BuildPipeline {
  private steps: BuildStep[] = [];
  private currentStep: number = 0;

  constructor() {
    this.initializePipeline();
  }

  private initializePipeline(): void {
    this.steps = [
      new ValidationStep(),
      new SceneProcessingStep(),
      new AssetProcessingStep(),
      new CodeProcessingStep(),
      new BundlingStep(),
      new OptimizationStep(),
      new PackagingStep(),
      new OutputStep()
    ];
  }

  async execute(config: BuildConfig): Promise<BuildResult> {
    const buildId = `build_${Date.now()}`;
    const startTime = Date.now();
    const errors: BuildError[] = [];
    const warnings: BuildWarning[] = [];
    const outputFiles: BuildFile[] = [];

    console.log(`Starting build: ${buildId}`);

    try {
      for (let i = 0; i < this.steps.length; i++) {
        this.currentStep = i;
        const step = this.steps[i];

        console.log(`Executing step: ${step.name}`);

        const stepResult = await step.execute(config, {
          buildId,
          outputFiles,
          errors,
          warnings
        });

        errors.push(...stepResult.errors);
        warnings.push(...stepResult.warnings);
        outputFiles.push(...stepResult.outputFiles);

        if (!stepResult.success) {
          throw new Error(`Build step failed: ${step.name}`);
        }
      }

      const duration = Date.now() - startTime;
      const stats = this.calculateStats(outputFiles, duration);

      return {
        success: true,
        buildId,
        duration,
        outputFiles,
        errors,
        warnings,
        stats
      };

    } catch (error) {
      const duration = Date.now() - startTime;

      return {
        success: false,
        buildId,
        duration,
        outputFiles,
        errors: [...errors, {
          file: 'build',
          line: 0,
          column: 0,
          message: error instanceof Error ? error.message : String(error),
          type: 'runtime'
        }],
        warnings,
        stats: this.calculateStats(outputFiles, duration)
      };
    }
  }

  private calculateStats(files: BuildFile[], buildTime: number): BuildStats {
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const compressedSize = files
      .filter(file => file.compressed)
      .reduce((sum, file) => sum + file.size, 0);

    return {
      totalSize,
      compressedSize,
      assetCount: files.filter(file => file.type === 'asset').length,
      sceneCount: files.filter(file => file.path.includes('scene')).length,
      buildTime,
      compressionRatio: compressedSize > 0 ? totalSize / compressedSize : 1
    };
  }

  getProgress(): number {
    return this.steps.length > 0 ? (this.currentStep / this.steps.length) * 100 : 0;
  }

  getCurrentStep(): string {
    return this.currentStep < this.steps.length ? this.steps[this.currentStep].name : 'Completed';
  }
}

export interface BuildStepContext {
  buildId: string;
  outputFiles: BuildFile[];
  errors: BuildError[];
  warnings: BuildWarning[];
}

export interface BuildStepResult {
  success: boolean;
  outputFiles: BuildFile[];
  errors: BuildError[];
  warnings: BuildWarning[];
}

export abstract class BuildStep {
  abstract name: string;

  abstract execute(config: BuildConfig, context: BuildStepContext): Promise<BuildStepResult>;

  protected createResult(
    success: boolean,
    outputFiles: BuildFile[] = [],
    errors: BuildError[] = [],
    warnings: BuildWarning[] = []
  ): BuildStepResult {
    return { success, outputFiles, errors, warnings };
  }
}

class ValidationStep extends BuildStep {
  name = 'Validation';

  async execute(config: BuildConfig, context: BuildStepContext): Promise<BuildStepResult> {
    const errors: BuildError[] = [];
    const warnings: BuildWarning[] = [];

    // 验证项目配置
    if (!config.projectId) {
      errors.push({
        file: 'config',
        line: 0,
        column: 0,
        message: 'Project ID is required',
        type: 'syntax'
      });
    }

    // 验证场景配置
    if (config.scenes.length === 0) {
      warnings.push({
        file: 'config',
        message: 'No scenes configured for build',
        type: 'compatibility'
      });
    }

    // 验证输出路径
    if (!config.outputPath) {
      errors.push({
        file: 'config',
        line: 0,
        column: 0,
        message: 'Output path is required',
        type: 'syntax'
      });
    }

    return this.createResult(errors.length === 0, [], errors, warnings);
  }
}

class SceneProcessingStep extends BuildStep {
  name = 'Scene Processing';

  async execute(config: BuildConfig, context: BuildStepContext): Promise<BuildStepResult> {
    const outputFiles: BuildFile[] = [];
    const errors: BuildError[] = [];

    // 处理包含的场景
    const includedScenes = config.scenes
      .filter(scene => scene.include)
      .sort((a, b) => a.order - b.order);

    for (const sceneConfig of includedScenes) {
      try {
        // 模拟场景处理
        const sceneData = await this.processScene(sceneConfig.id);

        outputFiles.push({
          path: `scenes/${sceneConfig.id}.scene`,
          size: sceneData.length,
          type: 'asset',
          compressed: false
        });

      } catch (error) {
        errors.push({
          file: `scenes/${sceneConfig.id}`,
          line: 0,
          column: 0,
          message: error instanceof Error ? error.message : String(error),
          type: 'runtime'
        });
      }
    }

    return this.createResult(errors.length === 0, outputFiles, errors);
  }

  private async processScene(sceneId: string): Promise<string> {
    // 模拟场景数据处理
    await new Promise(resolve => setTimeout(resolve, 100));
    return JSON.stringify({ sceneId, entities: [], assets: [] });
  }
}

class AssetProcessingStep extends BuildStep {
  name = 'Asset Processing';

  async execute(config: BuildConfig, context: BuildStepContext): Promise<BuildStepResult> {
    const outputFiles: BuildFile[] = [];
    const warnings: BuildWarning[] = [];

    // 处理资源压缩
    if (config.assets.compress) {
      const compressedAssets = await this.compressAssets(config);
      outputFiles.push(...compressedAssets);
    }

    // 检查资源质量设置
    if (config.assets.quality < 0.8) {
      warnings.push({
        file: 'assets',
        message: 'Low quality settings may affect visual quality',
        type: 'performance'
      });
    }

    return this.createResult(true, outputFiles, [], warnings);
  }

  private async compressAssets(config: BuildConfig): Promise<BuildFile[]> {
    // 模拟资源压缩
    return [
      {
        path: 'assets/textures.bundle',
        size: 1024 * 1024,
        type: 'asset',
        compressed: true
      },
      {
        path: 'assets/audio.bundle',
        size: 512 * 1024,
        type: 'asset',
        compressed: true
      }
    ];
  }
}

class CodeProcessingStep extends BuildStep {
  name = 'Code Processing';

  async execute(config: BuildConfig, context: BuildStepContext): Promise<BuildStepResult> {
    const outputFiles: BuildFile[] = [];
    const warnings: BuildWarning[] = [];

    // 处理代码压缩
    if (config.code.minify) {
      const minifiedCode = await this.minifyCode();
      outputFiles.push(minifiedCode);
    }

    // 处理代码混淆
    if (config.code.obfuscate) {
      warnings.push({
        file: 'code',
        message: 'Code obfuscation may affect debugging',
        type: 'deprecation'
      });
    }

    return this.createResult(true, outputFiles, [], warnings);
  }

  private async minifyCode(): Promise<BuildFile> {
    // 模拟代码压缩
    return {
      path: 'js/app.min.js',
      size: 256 * 1024,
      type: 'js',
      compressed: true
    };
  }
}

class BundlingStep extends BuildStep {
  name = 'Bundling';

  async execute(config: BuildConfig, context: BuildStepContext): Promise<BuildStepResult> {
    const outputFiles: BuildFile[] = [];

    // 创建主包
    const mainBundle = await this.createMainBundle(config);
    outputFiles.push(mainBundle);

    // 根据平台创建特定包
    const platformBundle = await this.createPlatformBundle(config);
    outputFiles.push(platformBundle);

    return this.createResult(true, outputFiles);
  }

  private async createMainBundle(config: BuildConfig): Promise<BuildFile> {
    return {
      path: 'bundles/main.bundle',
      size: 2 * 1024 * 1024,
      type: 'asset',
      compressed: true
    };
  }

  private async createPlatformBundle(config: BuildConfig): Promise<BuildFile> {
    return {
      path: `bundles/${config.platform}.bundle`,
      size: 512 * 1024,
      type: 'asset',
      compressed: true
    };
  }
}

class OptimizationStep extends BuildStep {
  name = 'Optimization';

  async execute(config: BuildConfig, context: BuildStepContext): Promise<BuildStepResult> {
    const warnings: BuildWarning[] = [];

    // 应用优化策略
    switch (config.optimization) {
      case AssetOptimization.BASIC:
        await this.applyBasicOptimization(context.outputFiles);
        break;
      case AssetOptimization.AGGRESSIVE:
        await this.applyAggressiveOptimization(context.outputFiles);
        warnings.push({
          file: 'optimization',
          message: 'Aggressive optimization may increase build time',
          type: 'performance'
        });
        break;
    }

    return this.createResult(true, [], [], warnings);
  }

  private async applyBasicOptimization(files: BuildFile[]): Promise<void> {
    // 基础优化逻辑
    console.log('Applying basic optimization...');
  }

  private async applyAggressiveOptimization(files: BuildFile[]): Promise<void> {
    // 激进优化逻辑
    console.log('Applying aggressive optimization...');
  }
}

class PackagingStep extends BuildStep {
  name = 'Packaging';

  async execute(config: BuildConfig, context: BuildStepContext): Promise<BuildStepResult> {
    const outputFiles: BuildFile[] = [];

    // 创建主包文件
    const packageFile = await this.createPackage(config, context.outputFiles);
    outputFiles.push(packageFile);

    // 创建清单文件
    const manifestFile = await this.createManifest(config, context.outputFiles);
    outputFiles.push(manifestFile);

    return this.createResult(true, outputFiles);
  }

  private async createPackage(config: BuildConfig, files: BuildFile[]): Promise<BuildFile> {
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);

    return {
      path: `${config.projectName}.${config.platform}`,
      size: totalSize,
      type: 'asset',
      compressed: true
    };
  }

  private async createManifest(config: BuildConfig, files: BuildFile[]): Promise<BuildFile> {
    const manifest = {
      name: config.projectName,
      version: config.version,
      platform: config.platform,
      files: files.map(file => ({
        path: file.path,
        size: file.size,
        compressed: file.compressed
      }))
    };

    return {
      path: 'manifest.json',
      size: JSON.stringify(manifest).length,
      type: 'manifest',
      compressed: false
    };
  }
}

class OutputStep extends BuildStep {
  name = 'Output';

  async execute(config: BuildConfig, context: BuildStepContext): Promise<BuildStepResult> {
    // 输出文件到指定目录
    console.log(`Outputting ${context.outputFiles.length} files to ${config.outputPath}`);

    // 模拟文件写入
    for (const file of context.outputFiles) {
      console.log(`Writing: ${file.path} (${file.size} bytes)`);
    }

    return this.createResult(true);
  }
}

export class ProjectBuildSystem {
  private pipeline: BuildPipeline;
  private buildHistory: BuildResult[] = [];

  constructor() {
    this.pipeline = new BuildPipeline();
  }

  /**
   * 构建项目
   */
  async buildProject(config: BuildConfig): Promise<BuildResult> {
    const result = await this.pipeline.execute(config);
    this.buildHistory.push(result);

    // 保留最近的10次构建记录
    if (this.buildHistory.length > 10) {
      this.buildHistory.shift();
    }

    return result;
  }

  /**
   * 获取构建进度
   */
  getBuildProgress(): number {
    return this.pipeline.getProgress();
  }

  /**
   * 获取当前构建步骤
   */
  getCurrentBuildStep(): string {
    return this.pipeline.getCurrentStep();
  }

  /**
   * 获取构建历史
   */
  getBuildHistory(): BuildResult[] {
    return [...this.buildHistory];
  }

  /**
   * 创建默认构建配置
   */
  createDefaultConfig(projectId: string, projectName: string): BuildConfig {
    return {
      projectId,
      projectName,
      version: '1.0.0',
      platform: BuildPlatform.WEB,
      mode: BuildMode.DEBUG,
      outputPath: './dist',
      optimization: AssetOptimization.BASIC,
      scenes: [],
      assets: {
        compress: true,
        format: 'auto',
        quality: 0.8
      },
      code: {
        minify: false,
        obfuscate: false,
        sourceMap: true
      },
      platformConfig: {}
    };
  }
}

// 全局构建系统实例
export const projectBuildSystem = new ProjectBuildSystem();
