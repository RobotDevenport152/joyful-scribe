# Pacific Alpacas — 素材补充更新说明

## 一、视频文件（最重要）

宣传视频 `宣传视频.mp4`（65秒, 5MB）需要放入项目：

```
public/videos/promo.mp4
```

**注意：** `终稿.mp4`（314MB CGTN版本）不放进项目，太大。
改为在 MediaCoverageSection 里用文字背书代替。

---

## 二、组件替换

把以下文件复制到对应路径覆盖原文件：

| 新文件 | 目标路径 |
|--------|----------|
| HeroSection.tsx | src/components/home/HeroSection.tsx |
| AuthorityBanner.tsx | src/components/home/AuthorityBanner.tsx |
| MediaCoverageSection.tsx | src/components/home/MediaCoverageSection.tsx |
| BrandHeritageSection.tsx | src/components/home/BrandHeritageSection.tsx |
| ChinaLanding.tsx | src/pages/ChinaLanding.tsx |

---

## 三、各组件的核心改动

### HeroSection.tsx
- **原来**：静态图片背景 `hero-comforter.jpg`
- **现在**：优先播放 `public/videos/promo.mp4`（65秒宣传片），视频加载失败自动降级为图片
- **新增**：消博会"1号参展商"角标 + 中文官网快速入口按钮

### AuthorityBanner.tsx
- **原来**：5个背书图标
- **现在**：7个图标，新增 **消博会1号参展商**、**三亚免税店** 两项最新动态
- **视觉**：新动态带红色高亮圆点 + 弹窗里有详细说明

### MediaCoverageSection.tsx
- **原来**：3条新闻，文字为主
- **现在**：5条新闻，新增：
  - 2026年消博会羊驼顶垫全球首发
  - 2025年三亚免税店入驻 + 1号参展商
  - 底部三项统计数据（30+媒体 / 1000万传播 / 6届连续参展）

### BrandHeritageSection.tsx
- **原来**：左图右文，单一图片
- **现在**：
  - 左图 `nz-alpaca.jpg` + 叠层小图 `alpaca-fiber.jpg`（纤维特写）
  - **Cloud of Dreams 毛利艺术家故事**（Patricia Erueti, Arawan 部落）
  - 产品图集：4张棚拍图（女款大衣、男款大衣、马甲、毛利围巾）hover效果

### ChinaLanding.tsx
- **新增**：消博会1号参展商 + 三亚免税店背书（带"新"标签）
- **新增**：2026年羊驼顶垫新品卡片（带"2026新品·全球首发"标签）
- **新增**：Cloud of Dreams 毛利设计师故事区块
- **新增**：Miss 新西兰代言背书图标
- **优化**：产品图改用真实棚拍图（非 Unsplash 占位图）

---

## 四、图片使用清单

项目 `public/images/` 里已有的图片，本次新增使用了：

| 图片文件 | 使用位置 |
|----------|----------|
| hero-comforter.jpg | HeroSection 视频封面/降级图 |
| nz-alpaca.jpg | BrandHeritageSection 左侧主图 |
| alpaca-fiber.jpg | BrandHeritageSection 叠层小图 |
| product-luxury-duvet.jpg | BrandHeritageSection Cloud of Dreams + ChinaLanding |
| product-classic-duvet.jpg | ChinaLanding 产品卡片 |
| product-coat-women.jpg | BrandHeritageSection 图集 + ChinaLanding |
| product-coat-men.jpg | BrandHeritageSection 图集 |
| product-vest-x6-front.jpg | BrandHeritageSection 图集 |
| product-scarf-maori.jpg | BrandHeritageSection 图集 |
| product-premium-duvet.jpg | ChinaLanding 新品（羊驼顶垫暂用） |
| hero-alpacas.jpg | GrowerNetworkSection（已有） |

---

## 五、目前还没放进去的宣传素材（未来可做）

| 素材 | 建议用途 |
|------|----------|
| Miss NZ 代言照（棚拍图） | ChinaLanding 或独立"品牌代言"区块 |
| 进博会活动照 | MediaCoverageSection 新闻卡片配图 |
| CGTN 采访截图 | MediaCoverageSection 媒体logo区 |
| 5张证书实物照 | CertificationsSection 图片替换图标 |
| 品牌手册 P20 App 界面截图 | GrowerDashboard 或关于页面 |
| 终稿.mp4（314MB CGTN完整版） | YouTube 外链，不放入项目 |
