// Verified timeline, lyrics, and RPG progression for 孙燕姿《爱情证书》(255.733s)

const TOTAL_DURATION = 255.733;

const SCENES_TIMELINE = [
  { id: 'intro',        start: 0.0,   end: 17.0,  date: '2000.09', chapter: '序章 · 异地必修课' },
  { id: 'library_girl', start: 17.0,  end: 33.0,  date: '2000.10', chapter: '第一课 · 寂寞学分' },
  { id: 'rainy_boy',    start: 33.0,  end: 48.0,  date: '2000.11', chapter: '随堂考 · 距离考卷' },
  { id: 'split_dorm',   start: 48.0,  end: 79.0,  date: '2000.12', chapter: '第二课 · 沟通的语言' },
  { id: 'sunset_train', start: 79.0,  end: 111.0, date: '2001.01', chapter: '旅途 · 交换幸福' },
  { id: 'winter_dawn',  start: 111.0, end: 140.2, date: '2001.02', chapter: '进阶课 · 飞越黑夜' },
  { id: 'viaduct_walk', start: 140.2, end: 171.0, date: '2001.04', chapter: '奔赴 · 忍耐与付出' },
  { id: 'rooftop_solo', start: 171.0, end: 203.0, date: '2001.05', chapter: '间奏 · 四季口琴声' },
  { id: 'reunion_cert', start: 203.0, end: 255.8, date: '2001.06', chapter: '终章 · 孤单毕业典礼' },
];

const LYRICS = [
  // Verse 1A - Her Library
  { start: 17.0, end: 22.8, text: '寂寞当然有一点', speaker: 'girl', note: '必修科目：寂寞 Lv.1' },
  { start: 23.0, end: 25.0, text: '你不在我身边', speaker: 'girl', note: '状态：思念值上升中…' },
  { start: 25.1, end: 32.5, text: '总是特别想念你的脸', speaker: 'girl', note: '翻看夹在笔记本里的合照' },

  // Verse 1B - His Rainy Street
  { start: 33.0, end: 38.8, text: '距离是一份考卷', speaker: 'boy', note: '随堂测验：异地 1,420 km' },
  { start: 39.0, end: 41.0, text: '测量相爱的誓言', speaker: 'boy', note: '收到简讯：「那边下雨了吗？」' },
  { start: 41.2, end: 47.6, text: '最后会不会实现', speaker: 'boy', note: '回复简讯：「等我去找你」' },

  // Pre-Chorus 1 - Split Dorm Rooms
  { start: 48.0, end: 54.6, text: '我们为爱还在学', speaker: 'duo', note: '双人修习：每日书信与电话' },
  { start: 55.0, end: 57.0, text: '学沟通的语言', speaker: 'girl', note: '技能习得：倾听 +10' },
  { start: 57.1, end: 58.6, text: '学着谅解', speaker: 'boy', note: '技能习得：体谅 +10' },
  { start: 58.7, end: 64.6, text: '学着不流泪', speaker: 'girl', note: '坚强值 UP · 擦干眼角' },
  { start: 65.0, end: 70.8, text: '等到我们学会飞', speaker: 'duo', note: '折一架飞越夜空的纸飞机' },
  { start: 71.0, end: 73.0, text: '飞越黑夜和考验', speaker: 'duo', note: '跨城夜空航线点亮！' },
  { start: 73.1, end: 78.7, text: '日子就要从孤单里毕业', speaker: 'duo', note: '距离毕业又近了一步' },

  // Chorus 1 - Sunset Train Journey
  { start: 79.0, end: 82.4, text: '我们用多一点点的辛苦', speaker: 'girl', note: '搭乘黄昏海滨列车出发' },
  { start: 82.5, end: 86.8, text: '来交换多一点点的幸福', speaker: 'girl', note: '收集沿途暖霞 · 幸福值 +15' },
  { start: 87.0, end: 90.8, text: '就算幸福', speaker: 'girl', note: '列车行驶中 · 尚余 980 km' },
  { start: 91.0, end: 94.2, text: '还有一段路', speaker: 'girl', note: '车票存根已攒下第 7 张' },
  { start: 94.4, end: 98.2, text: '等我们学会忍耐和付出', speaker: 'duo', note: '核心学分：忍耐与付出' },
  { start: 98.4, end: 102.8, text: '这爱情一定会有张证书', speaker: 'duo', note: '主线奖励预览：【爱情证书】' },
  { start: 103.0, end: 104.3, text: '证明', speaker: 'duo', note: '学分累计：55 / 100' },
  { start: 104.4, end: 110.5, text: '从此不孤独', speaker: 'duo', note: '两颗心在同一频道共振' },

  // Pre-Chorus 2 - Winter Snow to Rosy Dawn
  { start: 111.0, end: 116.8, text: '我们为爱还在学', speaker: 'duo', note: '冬夜初雪 · 围上同款围巾' },
  { start: 117.0, end: 118.9, text: '学沟通的语言', speaker: 'boy', note: '听筒那头传来温暖呼吸' },
  { start: 119.0, end: 120.8, text: '学着谅解', speaker: 'girl', note: '默契度突破 Lv.4' },
  { start: 120.9, end: 126.8, text: '学着不流泪', speaker: 'duo', note: '把想念化作微笑' },
  { start: 127.0, end: 132.8, text: '等到我们学会飞', speaker: 'duo', note: '寒冬渐远 · 天边泛起晨曦' },
  { start: 133.0, end: 134.9, text: '飞越黑夜和考验', speaker: 'duo', note: '破晓微光照亮两座城' },
  { start: 135.0, end: 140.0, text: '日子就要从孤单里毕业', speaker: 'duo', note: '春季学期开启 · 准备重逢！' },

  // Chorus 2 - Twilight Viaduct Walk
  { start: 140.2, end: 143.8, text: '我们用多一点点的辛苦', speaker: 'duo', note: '双向奔赴 · 穿过暮色铁道' },
  { start: 144.0, end: 147.8, text: '来交换多一点点的幸福', speaker: 'duo', note: '流星划过晚霞 · 心愿达成' },
  { start: 148.0, end: 151.8, text: '就算幸福', speaker: 'girl', note: '脚步加快中…' },
  { start: 152.0, end: 155.8, text: '还有一段路', speaker: 'boy', note: '前方就是重逢车站！' },
  { start: 156.0, end: 159.8, text: '等我们学会忍耐和付出', speaker: 'duo', note: '必修学分冲刺：82 / 100' },
  { start: 160.0, end: 163.8, text: '这爱情一定会有张证书', speaker: 'duo', note: '毕业审查进行中…' },
  { start: 164.0, end: 165.8, text: '证明', speaker: 'duo', note: '学分累计：86 / 100' },
  { start: 165.9, end: 170.8, text: '从此不孤独', speaker: 'duo', note: '晚风吹来熟悉的旋律' },

  // Bridge - Harmonica Solo & Vocalise
  { start: 171.2, end: 181.5, text: '♪ 晚霞天台 · 思念随风远行 ♪', speaker: 'boy', note: '间奏 · 回忆四季修满的学分' },
  { start: 181.6, end: 192.0, text: '♫ 口琴独奏 · 跨越山海的回响 ♫', speaker: 'boy', note: '距离倒数中 · 即将抵达终点站' },
  { start: 192.1, end: 202.8, text: '♪ 十九张车票 · 换一次盛夏重逢 ♪', speaker: 'duo', note: '必修学分 96 / 100 · 准备毕业！' },

  // Final Chorus 3 - Blossom Station Reunion & Certificate!
  { start: 203.0, end: 206.8, text: '我们用多一点点的辛苦', speaker: 'duo', note: '距离 0 km · 终于站在你面前！' },
  { start: 207.0, end: 210.8, text: '来交换多一点点的幸福', speaker: 'duo', note: '漫天花瓣飘落 · 同框达成 ♥' },
  { start: 211.0, end: 214.8, text: '就算幸福', speaker: 'duo', note: '所有的等待都有了答案' },
  { start: 215.0, end: 218.8, text: '还有一段路', speaker: 'duo', note: '以后的路，我们并肩一起走' },
  { start: 219.0, end: 222.8, text: '等我们学会忍耐和付出', speaker: 'duo', note: '★ 全科修满：100 / 100 ★' },
  { start: 223.0, end: 226.9, text: '这爱情一定会有张证书', speaker: 'duo', note: '授予专属道具：【爱情证书】！' },
  { start: 227.0, end: 228.9, text: '证明', speaker: 'duo', note: '盖下毕业红章：合格认证' },
  { start: 229.0, end: 235.5, text: '从此不孤独', speaker: 'duo', note: '恭喜从孤单里正式毕业 ♥' },

  // Outro - Sunset Bench Together
  { start: 236.0, end: 247.5, text: '♪ 余晖长椅 · 从此并肩看每一次日落 ♪', speaker: 'duo', note: '成就解锁：爱情证书持有者' },
];

const TOAST_EVENTS = [
  { start: 17.6, end: 22.2, text: '★ 开启课程：寂寞必修课 (+10 学分)' },
  { start: 34.0, end: 38.6, text: '✉ 新简讯：「今天特别想念你的脸」' },
  { start: 55.2, end: 60.0, text: '▲ 技能升级：沟通与谅解 Lv.2' },
  { start: 73.2, end: 78.2, text: '★ 阶段目标：准备从孤单里毕业！' },
  { start: 98.4, end: 103.5, text: '✦ 主线道具线索：【爱情证书】' },
  { start: 133.0, end: 138.2, text: '☀ 飞越黑夜考验 · 迎来破晓微光' },
  { start: 203.2, end: 208.5, text: '♥ 异地距离归零！同框重逢达成！' },
  { start: 222.8, end: 233.5, text: '★ 学分 100/100！正式颁发《爱情证书》' },
];

// Smooth piecewise progression for Credits (0 -> 100) and Distance (1420 km -> 0 km)
const KEYFRAMES = [
  { t: 0,   credits: 0,   dist: 1420 },
  { t: 17,  credits: 5,   dist: 1420 },
  { t: 33,  credits: 16,  dist: 1420 },
  { t: 48,  credits: 26,  dist: 1350 },
  { t: 79,  credits: 42,  dist: 1180 },
  { t: 111, credits: 58,  dist: 860 },
  { t: 140, credits: 72,  dist: 540 },
  { t: 171, credits: 86,  dist: 320 },
  { t: 202, credits: 98,  dist: 10 },
  { t: 204, credits: 99,  dist: 0 },
  { t: 222, credits: 100, dist: 0 },
  { t: 256, credits: 100, dist: 0 },
];

function getProgression(t) {
  for (let i = 0; i < KEYFRAMES.length - 1; i++) {
    const a = KEYFRAMES[i];
    const b = KEYFRAMES[i + 1];
    if (t >= a.t && t <= b.t) {
      const u = (t - a.t) / Math.max(0.001, b.t - a.t);
      return {
        credits: Math.round(a.credits + (b.credits - a.credits) * u),
        dist: Math.round(a.dist + (b.dist - a.dist) * u),
      };
    }
  }
  return { credits: 100, dist: 0 };
}

function getSceneAt(t) {
  for (let i = 0; i < SCENES_TIMELINE.length; i++) {
    const s = SCENES_TIMELINE[i];
    if (t >= s.start && t < s.end) {
      return { scene: s, index: i, localT: t - s.start, duration: s.end - s.start };
    }
  }
  const last = SCENES_TIMELINE[SCENES_TIMELINE.length - 1];
  return { scene: last, index: SCENES_TIMELINE.length - 1, localT: t - last.start, duration: last.end - last.start };
}

function getLyricAt(t) {
  for (let i = 0; i < LYRICS.length; i++) {
    const l = LYRICS[i];
    if (t >= l.start && t <= l.end) return l;
  }
  return null;
}

function getToastAt(t) {
  for (let i = 0; i < TOAST_EVENTS.length; i++) {
    const e = TOAST_EVENTS[i];
    if (t >= e.start && t <= e.end) return e;
  }
  return null;
}

module.exports = {
  TOTAL_DURATION,
  SCENES_TIMELINE,
  LYRICS,
  TOAST_EVENTS,
  getProgression,
  getSceneAt,
  getLyricAt,
  getToastAt,
};
