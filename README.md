# Chrono Earth · 时光地球

一个以 3D 地球为空间入口、以时间轴为叙事入口的纯前端沉浸式历史探索网站。

## 在线访问与发布

- 网站：https://rainthousand.github.io/chrono-earth/
- 仓库：https://github.com/rainthousand/chrono-earth
- 推送到 `main` 后，GitHub Actions 自动构建并发布 Pages。
- `npm run build:pages` 生成 `dist-pages/`，使用 `/chrono-earth/` 子目录；该入口直接在浏览器渲染，无需服务器或登录。
- `vite.pages.config.ts` 为静态版本统一调整公共资源、Service Worker 和 PWA 清单路径，保留原有 localhost 构建。

## 已实现

- CesiumJS 可旋转、缩放的 3D 地球
- 本地 Natural Earth 影像、星空、大气与动态光照
- 20 个精选历史景点和 42 个历史事件
- 景点光点、镜头飞行、搜索与随机漫游
- 公元前 3000 年至 2026 年的可播放时间轴
- 景点信息卡片与章节式故事模式
- 桌面端、平板与移动端布局
- 键盘焦点、减少动态效果与无障碍标签

## 开发

```bash
npm install
npm run dev
npm test
```

## 文档

- [产品与体验设计规格](./docs/product-design-spec.md)
- [技术与实施计划](./docs/implementation-plan.md)

## 核心产品原则

> 用户不是在地图上寻找地点，而是在转动地球、唤醒历史。

## 影像来源

高清地球纹理来自 NASA/Goddard Space Flight Center Scientific
Visualization Studio，Blue Marble Next Generation 数据由
Reto Stockli（NASA/GSFC）与 NASA Earth Observatory 提供。
