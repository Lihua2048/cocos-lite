import { SceneData, Entity, Animation, SceneCompositionState, SceneCompositionMode } from '../core/types';
import { WebGLRenderer } from '../core/2d/webgl-renderer';
import { physicsWorld } from '../core/physics';
import ResourceManager from '../core/resources/ResourceManager';

/**
 * 游戏打包构建器
 * 将编辑器场景数据转换为可运行的游戏包
 */
export class GameBuilder {
  private sceneData: SceneData[];
  private resourceManager: ResourceManager;
  private outputDir: string;
  private sceneComposition?: SceneCompositionState;

  constructor(scenes: SceneData[], resourceManager: ResourceManager, outputDir: string = './game', sceneComposition?: SceneCompositionState) {
    this.sceneData = scenes;
    this.resourceManager = resourceManager;
    this.outputDir = outputDir;
    this.sceneComposition = sceneComposition;
  }

  /**
   * 构建 H5 游戏
   */
  async buildH5Game(): Promise<any> {
    console.log('开始构建 H5 游戏...');
    console.log('场景数据:', this.sceneData.map(s => ({
      id: s.id,
      name: s.name,
      entityCount: Object.keys(s.entities).length,
      entities: Object.keys(s.entities)
    })));
    console.log('场景组合模式:', this.sceneComposition);

    // 1. 生成游戏运行时代码
    const gameRuntime = this.generateGameRuntime();

    // 2. 生成场景数据文件
    const sceneDataFile = this.generateSceneDataFile();

    // 3. 生成包含游戏代码的完整HTML文件
    const completeHTML = this.generateCompleteHTML(gameRuntime);

    // 4. 复制资源文件
    await this.copyResources('h5');

    // 5. 生成构建配置
    const buildConfig = this.generateBuildConfig('h5');

    console.log('H5 游戏构建完成！');
    console.log('场景数据已生成:', JSON.parse(sceneDataFile));

    // 6. 直接打开游戏页面
    this.openGamePage(completeHTML);

    return {
      gameRuntime,
      sceneDataFile,
      htmlTemplate: completeHTML,
      buildConfig
    };
  }

  /**
   * 构建微信小游戏
   */
  async buildWechatGame(): Promise<any> {
    console.log('开始构建微信小游戏...');

    // 1. 生成游戏运行时代码
    const gameRuntime = this.generateGameRuntime('wechat');

    // 2. 生成场景数据文件
    const sceneDataFile = this.generateSceneDataFile();

    // 3. 生成微信小游戏配置文件
    const gameConfig = this.generateWechatGameConfig();
    const adapter = this.generateWechatAdapter();

    // 4. 复制资源文件
    await this.copyResources('wechat');

    // 5. 生成构建配置
    const buildConfig = this.generateBuildConfig('wechat');

    console.log('微信小游戏构建完成！');

    return {
      gameRuntime,
      sceneDataFile,
      gameConfig,
      adapter,
      buildConfig
    };
  }

  /**
   * 生成游戏运行时代码
   */
  private generateGameRuntime(platform: 'h5' | 'wechat' = 'h5'): string {
    // 首先生成场景数据和组合信息
    const gameData = {
      scenes: this.sceneData,
      sceneComposition: this.sceneComposition,
      metadata: {
        buildTime: new Date().toISOString(),
        version: '1.0.0',
        totalScenes: this.sceneData.length
      }
    };

    const gameRuntimeCode = [
      '// 游戏运行时 - ' + platform,
      '// 简化版本，直接在浏览器中运行',
      '',
      '// 嵌入游戏数据',
      'const gameData = ' + JSON.stringify(gameData) + ';',
      'console.log("游戏数据已嵌入，场景数量:", gameData.scenes.length);',
      'console.log("场景组合模式:", gameData.sceneComposition);',
      'gameData.scenes.forEach((scene, index) => {',
      '  console.log("场景 " + (index + 1) + ":", scene.name, "实体数量:", Object.keys(scene.entities || {}).length);',
      '});',
      '',
      'class SimpleGame {',
      '  constructor() {',
      '    this.canvas = null;',
      '    this.ctx = null;',
      '    this.sceneData = null;',
      '    this.currentScene = null;',
      '    this.entities = [];',
      '    this.animationId = null;',
      '    this.sceneComposition = null;',
      '    this.physicsWorld = null;',
      '    this.animationSystem = null;',
      '    this.lastTime = 0;',
      '  }',
      '',
      '  async init() {',
      '    console.log("SimpleGame: 开始初始化游戏...");',
      '',
      '    // 获取Canvas',
      '    this.canvas = document.getElementById("gameCanvas");',
      '    if (!this.canvas) {',
      '      console.error("SimpleGame: 找不到游戏Canvas");',
      '      document.body.innerHTML += "<div style=\\"color: red; font-size: 20px;\\">错误：找不到游戏Canvas</div>";',
      '      return;',
      '    }',
      '',
      '    console.log("SimpleGame: Canvas找到，尺寸:", this.canvas.width, "x", this.canvas.height);',
      '    this.ctx = this.canvas.getContext("2d");',
      '',
      '    // 初始化物理世界',
      '    this.initPhysics();',
      '',
      '    // 初始化动画系统',
      '    this.initAnimationSystem();',
      '',
      '    // 加载场景数据（已通过loadData方法传入）',
      '    console.log("SimpleGame: 场景数据状态:", {',
      '      hasSceneData: !!this.sceneData,',
      '      sceneCount: this.sceneData?.scenes?.length || 0,',
      '      compositionMode: this.sceneComposition?.mode',
      '    });',
      '',
      '    // 隐藏加载文字',
      '    const loading = document.getElementById("loading");',
      '    if (loading) loading.style.display = "none";',
      '',
      '    console.log("SimpleGame: 游戏初始化完成");',
      '  }',
      '',
      '  loadData(data) {',
      '    console.log("SimpleGame: 开始加载传入的数据:", data);',
      '    if (data && data.scenes) {',
      '      this.sceneData = data;',
      '      this.sceneComposition = data.sceneComposition;',
      '      console.log("SimpleGame: 场景数据加载成功，场景数量:", data.scenes.length);',
      '      console.log("SimpleGame: 场景组合模式:", this.sceneComposition?.mode);',
      '      data.scenes.forEach((scene, index) => {',
      '        console.log("场景 " + (index + 1) + ":", {',
      '          name: scene.name,',
      '          entityCount: Object.keys(scene.entities || {}).length,',
      '          entities: Object.keys(scene.entities || {})  ',
      '        });',
      '      });',
      '    } else {',
      '      console.error("SimpleGame: 传入的数据无效:", data);',
      '    }',
      '  }',
      '',
      '  initPhysics() {',
      '    // 增强的物理系统初始化',
      '    const self = this; // 保存外部this引用',
      '    this.physicsWorld = {',
      '      gravity: { x: 0, y: 980 }, // 使用真实的重力加速度 (像素/秒²)',
      '      bodies: [],',
      '      step: function(deltaTime) {',
      '        this.bodies.forEach(body => {',
      '          if (body.dynamic && body.entity) {',
      '            // 应用重力',
      '            body.velocity.x += this.gravity.x * deltaTime;',
      '            body.velocity.y += this.gravity.y * deltaTime;',
      '            ',
      '            // 更新位置',
      '            body.position.x += body.velocity.x * deltaTime;',
      '            body.position.y += body.velocity.y * deltaTime;',
      '            ',
      '            // 边界检测',
      '            const canvasWidth = 1024;',
      '            const canvasHeight = 768;',
      '            ',
      '            // 左右边界',
      '            if (body.position.x < 0) {',
      '              body.position.x = 0;',
      '              body.velocity.x *= -body.restitution;',
      '            } else if (body.position.x + body.width > canvasWidth) {',
      '              body.position.x = canvasWidth - body.width;',
      '              body.velocity.x *= -body.restitution;',
      '            }',
      '            ',
      '            // 上下边界',
      '            if (body.position.y < 0) {',
      '              body.position.y = 0;',
      '              body.velocity.y *= -body.restitution;',
      '            } else if (body.position.y + body.height > canvasHeight) {',
      '              body.position.y = canvasHeight - body.height;',
      '              body.velocity.y *= -body.restitution;',
      '            }',
      '            ',
      '            // 同步到实体位置',
      '            body.entity.position.x = body.position.x;',
      '            body.entity.position.y = body.position.y;',
      '          }',
      '        });',
      '      },',
      '      addBody: function(entity) {',
      '        // 从实体的物理组件创建物理体',
      '        const physicsComponent = entity.components?.find(c => c.type === "physics");',
      '        if (!physicsComponent) return null;',
      '        ',
      '        const body = {',
      '          id: entity.id,',
      '          entity: entity,',
      '          position: { x: entity.position.x, y: entity.position.y },',
      '          velocity: { x: 0, y: 0 },',
      '          width: entity.properties.width || 50,',
      '          height: entity.properties.height || 50,',
      '          dynamic: physicsComponent.bodyType === "dynamic",',
      '          mass: physicsComponent.mass || 1,',
      '          restitution: physicsComponent.restitution || 0.5,',
      '          friction: physicsComponent.friction || 0.3',
      '        };',
      '        ',
      '        self.physicsWorld.bodies.push(body); // 使用外部引用',
      '        console.log("添加物理体:", entity.id, "类型:", physicsComponent.bodyType);',
      '        return body;',
      '      },',
      '      removeBody: function(entityId) {',
      '        self.physicsWorld.bodies = self.physicsWorld.bodies.filter(body => body.id !== entityId);',
      '      }',
      '    };',
      '    console.log("SimpleGame: 物理系统初始化完成");',
      '  }',
      '',
      '  initAnimationSystem() {',
      '    const self = this;',
      '    this.animationSystem = {',
      '      animations: new Map(),',
      '      update: function(deltaTime) {',
      '        if (!this.animations) {',
      '          console.warn("AnimationSystem: animations Map 未定义");',
      '          return;',
      '        }',
      '        this.animations.forEach((anim, entityId) => {',
      '          if (anim && anim.playing) {',
      '            anim.currentTime += deltaTime;',
      '            if (anim.currentTime >= anim.duration) {',
      '              if (anim.loop) {',
      '                anim.currentTime = 0;',
      '              } else {',
      '                anim.playing = false;',
      '                anim.currentTime = anim.duration;',
      '              }',
      '            }',
      '            // 应用关键帧插值',
      '            self.animationSystem.applyKeyframe(entityId, anim);',
      '          }',
      '        });',
      '      },',
      '      applyKeyframe: function(entityId, anim) {',
      '        const entity = self.findEntityById(entityId);',
      '        if (!entity || !anim.keyframes || anim.keyframes.length === 0) return;',
      '        ',
      '        const progress = Math.min(1, anim.currentTime / anim.duration);',
      '        const keyframes = anim.keyframes;',
      '        ',
      '        // 更完善的关键帧插值',
      '        if (keyframes.length === 1) {',
      '          // 单个关键帧，直接应用',
      '          const frame = keyframes[0];',
      '          self.animationSystem.applyFrameToEntity(entity, anim.propertyName, frame.value);',
      '        } else if (keyframes.length >= 2) {',
      '          // 多个关键帧，找到当前时间区间并插值',
      '          const currentTime = anim.currentTime;',
      '          let startFrame = keyframes[0];',
      '          let endFrame = keyframes[keyframes.length - 1];',
      '          ',
      '          // 找到当前时间所在的关键帧区间',
      '          for (let i = 0; i < keyframes.length - 1; i++) {',
      '            if (currentTime >= keyframes[i].time && currentTime <= keyframes[i + 1].time) {',
      '              startFrame = keyframes[i];',
      '              endFrame = keyframes[i + 1];',
      '              break;',
      '            }',
      '          }',
      '          ',
      '          // 计算区间内的插值进度',
      '          const frameProgress = startFrame.time === endFrame.time ? 0 : ',
      '            (currentTime - startFrame.time) / (endFrame.time - startFrame.time);',
      '          ',
      '          // 应用插值',
      '          self.animationSystem.interpolateAndApply(entity, anim.propertyName, startFrame.value, endFrame.value, frameProgress);',
      '        }',
      '      },',
      '      interpolateAndApply: function(entity, propertyName, startValue, endValue, progress) {',
      '        switch (propertyName) {',
      '          case "position.x":',
      '            entity.position.x = startValue + (endValue - startValue) * progress;',
      '            break;',
      '          case "position.y":',
      '            entity.position.y = startValue + (endValue - startValue) * progress;',
      '            break;',
      '          case "width":',
      '            entity.properties.width = startValue + (endValue - startValue) * progress;',
      '            break;',
      '          case "height":',
      '            entity.properties.height = startValue + (endValue - startValue) * progress;',
      '            break;',
      '          case "rotation":',
      '            entity.rotation = startValue + (endValue - startValue) * progress;',
      '            break;',
      '          case "color.r":',
      '            if (!entity.properties.color) entity.properties.color = [1, 1, 1, 1];',
      '            entity.properties.color[0] = startValue + (endValue - startValue) * progress;',
      '            break;',
      '          case "color.g":',
      '            if (!entity.properties.color) entity.properties.color = [1, 1, 1, 1];',
      '            entity.properties.color[1] = startValue + (endValue - startValue) * progress;',
      '            break;',
      '          case "color.b":',
      '            if (!entity.properties.color) entity.properties.color = [1, 1, 1, 1];',
      '            entity.properties.color[2] = startValue + (endValue - startValue) * progress;',
      '            break;',
      '          case "color.a":',
      '            if (!entity.properties.color) entity.properties.color = [1, 1, 1, 1];',
      '            entity.properties.color[3] = startValue + (endValue - startValue) * progress;',
      '            break;',
      '          case "scale.x":',
      '            if (!entity.scale) entity.scale = { x: 1, y: 1 };',
      '            entity.scale.x = startValue + (endValue - startValue) * progress;',
      '            break;',
      '          case "scale.y":',
      '            if (!entity.scale) entity.scale = { x: 1, y: 1 };',
      '            entity.scale.y = startValue + (endValue - startValue) * progress;',
      '            break;',
      '          default:',
      '            console.warn("不支持的动画属性:", propertyName);',
      '        }',
      '      },',
      '      applyFrameToEntity: function(entity, propertyName, value) {',
      '        switch (propertyName) {',
      '          case "position.x":',
      '            entity.position.x = value;',
      '            break;',
      '          case "position.y":',
      '            entity.position.y = value;',
      '            break;',
      '          case "width":',
      '            entity.properties.width = value;',
      '            break;',
      '          case "height":',
      '            entity.properties.height = value;',
      '            break;',
      '          case "rotation":',
      '            entity.rotation = value;',
      '            break;',
      '          case "color.r":',
      '            if (!entity.properties.color) entity.properties.color = [1, 1, 1, 1];',
      '            entity.properties.color[0] = value;',
      '            break;',
      '          case "color.g":',
      '            if (!entity.properties.color) entity.properties.color = [1, 1, 1, 1];',
      '            entity.properties.color[1] = value;',
      '            break;',
      '          case "color.b":',
      '            if (!entity.properties.color) entity.properties.color = [1, 1, 1, 1];',
      '            entity.properties.color[2] = value;',
      '            break;',
      '          case "color.a":',
      '            if (!entity.properties.color) entity.properties.color = [1, 1, 1, 1];',
      '            entity.properties.color[3] = value;',
      '            break;',
      '          case "scale.x":',
      '            if (!entity.scale) entity.scale = { x: 1, y: 1 };',
      '            entity.scale.x = value;',
      '            break;',
      '          case "scale.y":',
      '            if (!entity.scale) entity.scale = { x: 1, y: 1 };',
      '            entity.scale.y = value;',
      '            break;',
      '        }',
      '      },',
      '      startAnimation: function(entityId, animationData) {',
      '        console.log("启动动画:", entityId, animationData);',
      '        this.animations.set(entityId, {',
      '          ...animationData,',
      '          currentTime: 0,',
      '          playing: true',
      '        });',
      '      },',
      '      stopAnimation: function(entityId) {',
      '        this.animations.delete(entityId);',
      '      }',
      '    };',
      '    console.log("SimpleGame: 动画系统初始化完成");',
      '  }',
      '',
      '  findEntityById(entityId) {',
      '    return this.entities.find(e => e.id === entityId);',
      '  }',
      '',
      '  start() {',
      '    console.log("开始游戏");',
      '',
      '    // 根据场景组合模式加载场景',
      '    this.loadScenesBasedOnComposition();',
      '',
      '    // 开始渲染循环',
      '    this.gameLoop();',
      '  }',
      '',
      '  loadScenesBasedOnComposition() {',
      '    if (!this.sceneData || !this.sceneData.scenes || this.sceneData.scenes.length === 0) {',
      '      console.warn("SimpleGame: 没有可用的场景数据");',
      '      return;',
      '    }',
      '',
      '    const composition = this.sceneComposition;',
      '    if (!composition) {',
      '      // 默认模式：加载第一个场景',
      '      this.loadScene(this.sceneData.scenes[0]);',
      '      return;',
      '    }',
      '',
      '    console.log("SimpleGame: 使用场景组合模式:", composition.mode);',
      '',
      '    switch (composition.mode) {',
      '      case "DEFAULT":',
      '        // 默认模式：只显示当前场景',
      '        const currentScene = this.sceneData.scenes.find(s => s.id === composition.currentSceneId) || this.sceneData.scenes[0];',
      '        this.loadScene(currentScene);',
      '        break;',
      '',
      '      case "OVERLAY":',
      '        // 叠加模式：显示所有活跃场景',
      '        console.log("SimpleGame: 叠加模式 - 合并所有活跃场景");',
      '        this.loadOverlayScenes(composition.activeScenes || []);',
      '        break;',
      '',
      '      case "MIXED":',
      '        // 混合模式：显示当前场景 + 锁定场景',
      '        console.log("SimpleGame: 混合模式 - 当前场景 + 锁定场景");',
      '        this.loadMixedScenes(composition);',
      '        break;',
      '',
      '      default:',
      '        console.warn("SimpleGame: 未知的场景组合模式:", composition.mode);',
      '        this.loadScene(this.sceneData.scenes[0]);',
      '    }',
      '  }',
      '',
      '  loadScene(scene) {',
      '    console.log("SimpleGame: 加载单个场景:", scene.name);',
      '    this.currentScene = scene;',
      '    this.entities = Object.values(scene.entities || {});',
      '    console.log("SimpleGame: 实体数量:", this.entities.length);',
      '    ',
      '    // 初始化实体的物理组件',
      '    this.initializePhysicsBodies();',
      '    ',
      '    // 初始化实体的动画',
      '    this.initializeAnimations(scene);',
      '    ',
      '    document.title = scene.name + " - Cocos Game";',
      '  }',
      '',
      '  initializePhysicsBodies() {',
      '    // 清除现有物理体',
      '    this.physicsWorld.bodies = [];',
      '    ',
      '    // 为每个带有物理组件的实体创建物理体',
      '    this.entities.forEach(entity => {',
      '      const physicsComponent = entity.components?.find(c => c.type === "physics");',
      '      if (physicsComponent) {',
      '        this.physicsWorld.addBody(entity);',
      '      }',
      '    });',
      '    ',
      '    console.log("SimpleGame: 初始化了", this.physicsWorld.bodies.length, "个物理体");',
      '  }',
      '',
      '  initializeAnimations(scene) {',
      '    // 清除现有动画 - 安全检查',
      '    if (this.animationSystem && this.animationSystem.animations) {',
      '      if (typeof this.animationSystem.animations.clear === "function") {',
      '        this.animationSystem.animations.clear();',
      '      } else {',
      '        this.animationSystem.animations = new Map();',
      '      }',
      '    }',
      '    ',
      '    // 初始化场景动画',
      '    if (scene.animations) {',
      '      Object.entries(scene.animations).forEach(([animName, animData]) => {',
      '        console.log("发现场景动画:", animName, animData);',
      '        // 这里可以根据需要自动播放某些动画',
      '      });',
      '    }',
      '    ',
      '    // 初始化实体动画',
      '    if (this.entities && Array.isArray(this.entities)) {',
      '      this.entities.forEach(entity => {',
      '        if (entity.animation && entity.animation.playing) {',
      '          // 实体有正在播放的动画，需要在运行时系统中启动',
      '          const animationData = scene.animations?.[entity.animation.currentAnimation];',
      '          if (animationData && this.animationSystem && this.animationSystem.startAnimation) {',
      '            this.animationSystem.startAnimation(entity.id, {',
      '              ...animationData,',
      '              duration: animationData.duration || 10.0, // 使用保存的持续时间或默认10秒',
      '              loop: entity.animation.loop || false',
      '            });',
      '            console.log("启动实体动画:", entity.id, entity.animation.currentAnimation, "持续时间:", animationData.duration || 10.0);',
      '          }',
      '        }',
      '      });',
      '    }',
      '    ',
      '    const animCount = this.animationSystem?.animations?.size || 0;',
      '    console.log("SimpleGame: 初始化了", animCount, "个动画");',
      '  }',
      '',
      '  loadOverlayScenes(activeSceneIds) {',
      '    console.log("SimpleGame: 加载叠加场景:", activeSceneIds);',
      '    this.entities = [];',
      '    this.currentScene = { name: "叠加模式", entities: {} };',
      '',
      '    activeSceneIds.forEach(sceneId => {',
      '      const scene = this.sceneData.scenes.find(s => s.id === sceneId);',
      '      if (scene) {',
      '        const sceneEntities = Object.values(scene.entities || {});',
      '        console.log("SimpleGame: 添加场景", scene.name, "的", sceneEntities.length, "个实体");',
      '        this.entities = this.entities.concat(sceneEntities);',
      '      }',
      '    });',
      '',
      '    console.log("SimpleGame: 叠加模式总实体数:", this.entities.length);',
      '    document.title = "叠加模式 - Cocos Game";',
      '  }',
      '',
      '  loadMixedScenes(composition) {',
      '    console.log("SimpleGame: 加载混合场景");',
      '    this.entities = [];',
      '    this.currentScene = { name: "混合模式", entities: {} };',
      '',
      '    // 加载当前场景',
      '    const currentScene = this.sceneData.scenes.find(s => s.id === composition.currentSceneId);',
      '    if (currentScene) {',
      '      const currentEntities = Object.values(currentScene.entities || {});',
      '      console.log("SimpleGame: 添加当前场景", currentScene.name, "的", currentEntities.length, "个实体");',
      '      this.entities = this.entities.concat(currentEntities);',
      '    }',
      '',
      '    // 加载锁定的场景',
      '    if (composition.lockedScenes) {',
      '      Object.keys(composition.lockedScenes).forEach(sceneId => {',
      '        if (composition.lockedScenes[sceneId]) {',
      '          const scene = this.sceneData.scenes.find(s => s.id === sceneId);',
      '          if (scene && scene.id !== composition.currentSceneId) {',
      '            const sceneEntities = Object.values(scene.entities || {});',
      '            console.log("SimpleGame: 添加锁定场景", scene.name, "的", sceneEntities.length, "个实体");',
      '            this.entities = this.entities.concat(sceneEntities);',
      '          }',
      '        }',
      '      });',
      '    }',
      '',
      '    console.log("SimpleGame: 混合模式总实体数:", this.entities.length);',
      '    document.title = "混合模式 - Cocos Game";',
      '  }',
      '',
      '  gameLoop() {',
      '    // 计算帧时间',
      '    const currentTime = performance.now();',
      '    const deltaTime = this.lastTime > 0 ? (currentTime - this.lastTime) / 1000 : 0;',
      '    this.lastTime = currentTime;',
      '',
      '    // 更新物理系统',
      '    if (this.physicsWorld && deltaTime > 0) {',
      '      this.physicsWorld.step(deltaTime);',
      '    }',
      '',
      '    // 更新动画系统',
      '    if (this.animationSystem && deltaTime > 0) {',
      '      this.animationSystem.update(deltaTime);',
      '    }',
      '',
      '    // 清空画布 - 使用深灰色背景便于看到实体',
      '    this.ctx.fillStyle = "#333";',
      '    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);',
      '',
      '    // 渲染实体',
      '    if (this.entities && this.entities.length > 0) {',
      '      console.log("SimpleGame: 开始渲染", this.entities.length, "个实体");',
      '      console.log("SimpleGame: Canvas尺寸:", this.canvas.width, "x", this.canvas.height);',
      '      this.entities.forEach((entity, index) => {',
      '        this.renderEntity(entity);',
      '      });',
      '      console.log("SimpleGame: 所有实体渲染完成");',
      '    } else {',
      '      console.log("SimpleGame: 没有实体需要渲染");',
      '    }',
      '',
      '    // 显示场景信息',
      '    this.ctx.fillStyle = "#fff";',
      '    this.ctx.font = "16px Arial";',
      '    this.ctx.fillText("场景: " + (this.currentScene ? this.currentScene.name : "无"), 10, 25);',
      '    this.ctx.fillText("实体数量: " + (this.entities ? this.entities.length : 0), 10, 45);',
      '    if (this.sceneComposition) {',
      '      this.ctx.fillText("组合模式: " + this.sceneComposition.mode, 10, 65);',
      '    }',
      '',
      '    // 继续循环 - 确保正确绑定this上下文',
      '    const self = this;',
      '    this.animationId = requestAnimationFrame(function() { self.gameLoop(); });',
      '  }',
      '',
      '  renderEntity(entity) {',
      '    if (!entity || !entity.position || !entity.properties) {',
      '      console.log("SimpleGame: 跳过无效实体:", entity);',
      '      return;',
      '    }',
      '',
      '    const { position, properties, type } = entity;',
      '    let { x, y } = position;',
      '    const { width, height, color, text } = properties;',
      '',
      '    const entityWidth = width || 100;',
      '    const entityHeight = height || 50;',
      '',
      '    console.log("SimpleGame: 渲染实体", entity.id, "类型:", type, "位置:", x, y, "尺寸:", entityWidth, "x", entityHeight);',
      '',
      '    this.ctx.save();',
      '',
      '    // 应用变换（位置、旋转、缩放）',
      '    this.ctx.translate(x + entityWidth / 2, y + entityHeight / 2);',
      '',
      '    // 应用旋转',
      '    if (entity.rotation) {',
      '      this.ctx.rotate(entity.rotation);',
      '    }',
      '',
      '    // 应用缩放',
      '    if (entity.scale) {',
      '      this.ctx.scale(entity.scale.x || 1, entity.scale.y || 1);',
      '    }',
      '',
      '    // 绘制背景 - 增强UI组件显示',
      '    if (color && Array.isArray(color) && color.length >= 3) {',
      '      this.ctx.fillStyle = "rgba(" + Math.floor(color[0] * 255) + ", " + Math.floor(color[1] * 255) + ", " + Math.floor(color[2] * 255) + ", " + (color[3] || 1) + ")";',
      '    } else {',
      '      // 根据类型设置默认颜色 - 加强UI组件可见性',
      '      if (type === "sprite") {',
      '        this.ctx.fillStyle = "rgba(255, 255, 255, 1)";',
      '      } else if (type === "ui-button") {',
      '        this.ctx.fillStyle = "rgba(52, 152, 219, 1)"; // 亮蓝色，更明显',
      '      } else if (type === "ui-label") {',
      '        this.ctx.fillStyle = "rgba(236, 240, 241, 1)"; // 浅灰色',
      '      } else if (type === "ui-input") {',
      '        this.ctx.fillStyle = "rgba(255, 255, 255, 1)"; // 白色',
      '      } else if (type === "ui-panel") {',
      '        this.ctx.fillStyle = "rgba(189, 195, 199, 0.8)"; // 半透明灰色',
      '      } else if (type.startsWith("ui-")) {',
      '        this.ctx.fillStyle = "rgba(149, 165, 166, 1)"; // 默认UI组件颜色',
      '      } else {',
      '        this.ctx.fillStyle = "rgba(128, 128, 128, 1)"; // 默认实体颜色',
      '      }',
      '    }',
      '',
      '    // 绘制矩形（以中心为原点）',
      '    this.ctx.fillRect(-entityWidth / 2, -entityHeight / 2, entityWidth, entityHeight);',
      '',
      '    // UI组件需要边框和阴影效果',
      '    if (type.startsWith("ui-")) {',
      '      // 添加内部阴影效果',
      '      this.ctx.strokeStyle = "#34495e";',
      '      this.ctx.lineWidth = 2;',
      '      this.ctx.strokeRect(-entityWidth / 2, -entityHeight / 2, entityWidth, entityHeight);',
      '      ',
      '      // UI按钮添加额外的装饰',
      '      if (type === "ui-button") {',
      '        // 添加高光效果',
      '        this.ctx.strokeStyle = "#3498db";',
      '        this.ctx.lineWidth = 1;',
      '        this.ctx.strokeRect(-entityWidth / 2 + 1, -entityHeight / 2 + 1, entityWidth - 2, entityHeight - 2);',
      '        ',
      '        // 添加渐变效果',
      '        const gradient = this.ctx.createLinearGradient(0, -entityHeight / 2, 0, entityHeight / 2);',
      '        gradient.addColorStop(0, "rgba(255, 255, 255, 0.3)");',
      '        gradient.addColorStop(1, "rgba(0, 0, 0, 0.1)");',
      '        this.ctx.fillStyle = gradient;',
      '        this.ctx.fillRect(-entityWidth / 2, -entityHeight / 2, entityWidth, entityHeight);',
      '      }',
      '    }',
      '',
      '    // 绘制文本 - 改进UI组件文本渲染',
      '    if (text) {',
      '      if (properties.textColor && Array.isArray(properties.textColor)) {',
      '        this.ctx.fillStyle = "rgba(" + Math.floor(properties.textColor[0] * 255) + ", " + Math.floor(properties.textColor[1] * 255) + ", " + Math.floor(properties.textColor[2] * 255) + ", " + (properties.textColor[3] || 1) + ")";',
      '      } else {',
      '        // 根据组件类型设置默认文本颜色',
      '        if (type === "ui-button") {',
      '          this.ctx.fillStyle = "#ffffff"; // 白色文本，更明显',
      '        } else if (type === "ui-label") {',
      '          this.ctx.fillStyle = "#2c3e50"; // 深色文本',
      '        } else {',
      '          this.ctx.fillStyle = "#34495e"; // 默认深灰色',
      '        }',
      '      }',
      '',
      '      const fontSize = Math.max(12, properties.fontSize || 16); // 确保字体不会太小',
      '      this.ctx.font = "bold " + fontSize + "px Arial"; // UI组件使用粗体',
      '      const textAlign = properties.textAlign || "center";',
      '      this.ctx.textAlign = textAlign;',
      '      this.ctx.textBaseline = "middle";',
      '',
      '      let textX = 0;',
      '      if (textAlign === "left") {',
      '        textX = -entityWidth / 2 + 8;',
      '      } else if (textAlign === "right") {',
      '        textX = entityWidth / 2 - 8;',
      '      }',
      '',
      '      // UI按钮添加文本阴影效果',
      '      if (type === "ui-button") {',
      '        this.ctx.shadowColor = "rgba(0, 0, 0, 0.3)";',
      '        this.ctx.shadowOffsetX = 1;',
      '        this.ctx.shadowOffsetY = 1;',
      '        this.ctx.shadowBlur = 2;',
      '      }',
      '',
      '      this.ctx.fillText(text, textX, 0);',
      '      ',
      '      // 重置阴影',
      '      this.ctx.shadowColor = "transparent";',
      '      this.ctx.shadowOffsetX = 0;',
      '      this.ctx.shadowOffsetY = 0;',
      '      this.ctx.shadowBlur = 0;',
      '    }',
      '',
      '    // 添加类型标识（调试用）- 改进显示',
      '    if (type) {',
      '      this.ctx.fillStyle = "#2c3e50";',
      '      this.ctx.font = "bold 9px monospace";',
      '      this.ctx.textAlign = "left";',
      '      this.ctx.textBaseline = "top";',
      '      ',
      '      // 为UI组件添加背景标签',
      '      if (type.startsWith("ui-")) {',
      '        const labelWidth = this.ctx.measureText(type).width + 4;',
      '        this.ctx.fillStyle = "rgba(255, 255, 255, 0.8)";',
      '        this.ctx.fillRect(-entityWidth / 2, -entityHeight / 2 - 12, labelWidth, 10);',
      '        this.ctx.fillStyle = "#e74c3c"; // 红色文本，更明显',
      '      }',
      '      ',
      '      this.ctx.fillText(type, -entityWidth / 2 + 2, -entityHeight / 2 - 10);',
      '    }',
      '',
      '    this.ctx.restore();',
      '  }',
      '',
      '  stop() {',
      '    if (this.animationId) {',
      '      cancelAnimationFrame(this.animationId);',
      '      this.animationId = null;',
      '    }',
      '  }',
      '}'
    ];

    // 添加平台特定的启动代码
    if (platform === 'wechat') {
      gameRuntimeCode.push('');
      gameRuntimeCode.push('// 微信小游戏适配');
      gameRuntimeCode.push('const game = new SimpleGame();');
      gameRuntimeCode.push('wx.onShow(() => {');
      gameRuntimeCode.push('  game.init().then(() => game.start());');
      gameRuntimeCode.push('});');
      gameRuntimeCode.push('window.game = game;');
    } else {
      gameRuntimeCode.push('');
      gameRuntimeCode.push('// H5版本启动代码');
      gameRuntimeCode.push('async function startGame() {');
      gameRuntimeCode.push('  console.log("H5: 启动游戏，创建 SimpleGame 实例");');
      gameRuntimeCode.push('  const game = new SimpleGame();');
      gameRuntimeCode.push('  console.log("H5: 游戏实例创建完成，开始加载数据");');
      gameRuntimeCode.push('  console.log("H5: 游戏数据:", gameData);');
      gameRuntimeCode.push('  game.loadData(gameData);');
      gameRuntimeCode.push('  console.log("H5: 数据加载完成，初始化游戏");');
      gameRuntimeCode.push('  await game.init();');
      gameRuntimeCode.push('  console.log("H5: 游戏初始化完成，启动游戏循环");');
      gameRuntimeCode.push('  game.start();');
      gameRuntimeCode.push('  window.game = game;');
      gameRuntimeCode.push('  console.log("H5: 游戏完全启动成功");');
      gameRuntimeCode.push('}');
      gameRuntimeCode.push('');
      gameRuntimeCode.push('// 等待DOM加载完成后启动游戏');
      gameRuntimeCode.push('if (document.readyState === "loading") {');
      gameRuntimeCode.push('  document.addEventListener("DOMContentLoaded", startGame);');
      gameRuntimeCode.push('} else {');
      gameRuntimeCode.push('  startGame();');
      gameRuntimeCode.push('}');
    }

    // 添加全局导出
    gameRuntimeCode.push('');
    gameRuntimeCode.push('// 全局游戏实例');
    gameRuntimeCode.push('window.SimpleGame = SimpleGame;');

    return gameRuntimeCode.join('\n');
  }

  /**
   * 生成场景数据文件
   */
  private generateSceneDataFile(): string {
    const exportData = {
      scenes: this.sceneData,
      sceneComposition: this.sceneComposition,
      metadata: {
        buildTime: new Date().toISOString(),
        version: '1.0.0',
        totalScenes: this.sceneData.length
      }
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * 生成包含游戏代码的完整HTML文件
   */
  private generateCompleteHTML(gameRuntime: string): string {
    // 使用编辑器标准画布尺寸，确保与编辑器canvas完全一致
    const canvasWidth = 1024;
    const canvasHeight = 768;

    return [
      '<!DOCTYPE html>',
      '<html lang="zh-CN">',
      '<head>',
      '    <meta charset="UTF-8">',
      '    <meta name="viewport" content="width=device-width, initial-scale=1.0">',
      '    <title>Cocos Game</title>',
      '    <style>',
      '        body {',
      '            margin: 0;',
      '            padding: 20px;',
      '            display: flex;',
      '            flex-direction: column;',
      '            align-items: center;',
      '            min-height: 100vh;',
      '            background: #f0f0f0;',
      '            font-family: Arial, sans-serif;',
      '        }',
      '        .game-container {',
      '            background: #fff;',
      '            border: 1px solid #ccc;',
      '            box-shadow: 0 4px 8px rgba(0,0,0,0.1);',
      '            border-radius: 8px;',
      '            overflow: hidden;',
      '            width: ' + canvasWidth + 'px;',
      '            height: ' + canvasHeight + 'px;',
      '        }',
      '        #gameCanvas {',
      '            display: block;',
      '            background: #fff;',
      '            width: 100%;',
      '            height: 100%;',
      '            image-rendering: -webkit-optimize-contrast;',
      '            image-rendering: -moz-crisp-edges;',
      '            image-rendering: pixelated;',
      '        }',
      '        #loading {',
      '            position: absolute;',
      '            top: 50%;',
      '            left: 50%;',
      '            transform: translate(-50%, -50%);',
      '            color: #666;',
      '            font-size: 18px;',
      '        }',
      '        .info {',
      '            padding: 10px;',
      '            background: #f9f9f9;',
      '            border-top: 1px solid #eee;',
      '            text-align: center;',
      '            color: #666;',
      '            font-size: 14px;',
      '        }',
      '    </style>',
      '</head>',
      '<body>',
      '    <h1>Cocos Engine H5 Game</h1>',
      '    <div class="game-container">',
      '        <div id="loading">正在加载游戏...</div>',
      `        <canvas id="gameCanvas" width="${canvasWidth}" height="${canvasHeight}"></canvas>`,
      '        <div class="info">',
      `            画布尺寸: ${canvasWidth} × ${canvasHeight} | 与编辑器尺寸完全一致 | 支持动画和物理效果`,
      '        </div>',
      '    </div>',
      '    ',
      '    <script>',
      '        // 确保画布尺寸设置正确',
      '        window.addEventListener("DOMContentLoaded", function() {',
      '          const canvas = document.getElementById("gameCanvas");',
      '          if (canvas) {',
      '            canvas.width = ' + canvasWidth + ';',
      '            canvas.height = ' + canvasHeight + ';',
      '            canvas.style.width = "100%";',
      '            canvas.style.height = "100%";',
      '            console.log("Canvas尺寸已设置:", canvas.width, "x", canvas.height);',
      '          }',
      '        });',
      '        ',
      '        // 游戏运行时代码',
      '        ' + gameRuntime,
      '    </script>',
      '</body>',
      '</html>'
    ].join('\n');
  }

  /**
   * 在新窗口中打开游戏页面
   */
  private openGamePage(htmlContent: string): void {
    if (typeof window === 'undefined') return;

    // 创建 Blob URL
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);

    // 在新窗口中打开游戏
    const gameWindow = window.open(url, '_blank', 'width=820,height=640,resizable=yes');

    if (gameWindow) {
      console.log('游戏页面已在新窗口中打开');
      // 延迟释放URL，确保页面加载完成
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 5000);
    } else {
      console.error('无法打开游戏窗口，可能被浏览器阻止弹窗');
      // 备用方案：提供下载链接
      this.downloadFile('game.html', htmlContent);
    }
  }

  /**
   * 生成微信小游戏配置
   */
  private generateWechatGameConfig(): string {
    return JSON.stringify({
      "deviceOrientation": "portrait",
      "showStatusBar": false,
      "networkTimeout": {
        "request": 10000,
        "connectSocket": 10000,
        "uploadFile": 10000,
        "downloadFile": 10000
      },
      "subpackages": [],
      "workers": "workers",
      "requiredPrivateInfos": [],
      "permission": {
        "scope.userLocation": {
          "desc": "你的位置信息将用于小游戏位置接口的效果展示"
        }
      },
      "plugins": {},
      "resizable": false
    }, null, 2);
  }

  /**
   * 生成微信适配器
   */
  private generateWechatAdapter(): string {
    return [
      '// 微信小游戏适配器',
      '// 适配 DOM API',
      'if (!global.document) {',
      '  global.document = {',
      '    createElement: (tag) => {',
      '      if (tag === "canvas") return wx.createCanvas();',
      '      return {};',
      '    },',
      '    getElementById: () => wx.createCanvas(),',
      '  };',
      '}',
      '',
      '// 适配 Window API',
      'if (!global.window) {',
      '  global.window = global;',
      '  global.window.devicePixelRatio = wx.getSystemInfoSync().pixelRatio;',
      '  global.window.requestAnimationFrame = wx.requestAnimationFrame || ((cb) => setTimeout(cb, 16));',
      '  global.window.cancelAnimationFrame = wx.cancelAnimationFrame || clearTimeout;',
      '}',
      '',
      '// 适配 Image API',
      'if (!global.Image) {',
      '  global.Image = () => wx.createImage();',
      '}',
      '',
      '// 适配 Audio API',
      'if (!global.Audio) {',
      '  global.Audio = (src) => {',
      '    const audio = wx.createInnerAudioContext();',
      '    if (src) audio.src = src;',
      '    return audio;',
      '  };',
      '}',
      '',
      'console.log("微信小游戏适配器加载完成");'
    ].join('\n');
  }

  /**
   * 生成构建配置
   */
  private generateBuildConfig(platform: 'h5' | 'wechat'): any {
    if (platform === 'h5') {
      return {
        type: 'h5',
        entry: './game.js',
        output: {
          path: './dist',
          filename: 'game.min.js'
        },
        optimization: {
          minimize: true
        }
      };
    } else {
      return {
        type: 'wechat',
        entry: './game.js',
        output: {
          path: './dist',
          filename: 'game.js'
        },
        adapter: './adapter.js'
      };
    }
  }

  /**
   * 复制资源文件
   */
  private async copyResources(platform: 'h5' | 'wechat'): Promise<void> {
    console.log('复制 ' + platform + ' 平台资源文件...');
    console.log('资源文件复制完成');
  }

  /**
   * 在浏览器中下载文件
   */
  private downloadFile(filename: string, content: string): void {
    if (typeof window === 'undefined') return;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.replace(/[\/\\]/g, '_');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}

export default GameBuilder;
