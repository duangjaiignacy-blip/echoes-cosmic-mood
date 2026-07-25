# 情绪转盘全域拖拽设计规格

日期：2026-07-25
基线：`feature/glassy-space-orb` / `publish/main` @ `2ebb23b`

## 目标

在 Echo Void 首屏的整个约 300px 圆形情绪转盘内，用户从中央情绪球、刻度、展开的情绪文字或圆环空白区域任意位置按下，都能连续拖动并切换情绪。下方“就是这种感觉”按钮不属于转盘，不参与拖拽。

## 根因

- 拖拽钩子当前在 `.echo-feel-dial` 上通过冒泡阶段的原生 `pointerdown` 启动。
- 中央 `.mood-orbit-toggle` 已声明 `data-mood-drag-surface="true"` 且不阻断事件，所以可拖。
- 刻度 `.mood-orbit-step` 和可见文字 `.mood-orbit-text` 是独立按钮，它们在 `pointerdown` 中执行 `stopPropagation()`；同时拖拽守卫会默认拒绝普通按钮。手指落在这些区域时，转盘根节点收不到可启动的拖拽事件，因而形成不连续的“死区”。

## 交互设计

- 将 `.echo-feel-dial` 根节点声明为统一的 mood drag surface。
- `useMoodSwipe` 在捕获阶段监听 `pointerdown`，使根节点优先启动指针会话，不再受内部按钮冒泡阻断影响。
- 删除刻度和情绪文字上的拖拽阻断处理，使 DOM 语义与实际交互一致。
- 移动距离未达现有 6px 轴锁阈值时，仍视为普通点击：刻度和情绪文字保留直接选择能力。
- 一旦超过 6px 并锁定横向或纵向拖拽轴，该指针会话标记为真实拖动；释放后捕获并阻止由此次拖动派生的点击，避免转盘先滑到新情绪、又被原始按下的刻度或文字拉回。
- 指针取消、非主指针和鼠标非左键仍按现有逻辑处理，不引入多指或新的惯性规则。

## 实现边界

- `src/pages/Home.tsx`：仅在 Echo Void 的转盘根节点上标记统一拖拽表面。
- `src/lib/useMoodSwipe.ts`：负责捕获阶段启动、记录是否真正拖动，以及拖动后的单次 click 抑制。
- `src/components/MoodOrbitCarousel.tsx`：移除刻度和文字的 `stopDrag` / `onPointerDown` 阻断，保留原有 `onClick`、ARIA 和键盘能力。
- `src/components/moodSwipeModel.ts`：保留现有 6px 轴锁、28px 切档和最多额外一档的投射规则，不调整手感参数。
- 不修改 WebGL 星空、情绪图片、转盘尺寸、视觉动效、确认按钮或其他页面。

## 验收与测试

- 样式/DOM 合约测试证明转盘根节点是全域拖拽表面，刻度和文字不再阻断 `pointerdown`。
- 拖拽模型或独立助手测试证明：低于 6px 为点击，超过 6px 标记为拖动，仅真实拖动抑制随后的一次点击。
- 真实浏览器分别从中央球、上/下/左/右刻度、展开文字和空白圆环开始鼠标与触摸模拟拖动，每个起点都必须切换情绪。
- 单击刻度/文字仍能直接选择；拖动释放后不发生意外回跳。
- 已跟踪全量测试、生产构建、Lint 和 `git diff --check` 通过后才发布。
