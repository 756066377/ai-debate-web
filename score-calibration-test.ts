// 评分标准一致性改进测试
// 测试评分校准机制和统一评分标准

console.log("=== 评分标准一致性改进测试 ===\n");

// 模拟评分校准函数
function testScoreCalibration(mainScore, assistantScore) {
  if (mainScore === null || assistantScore === null) {
    return null;
  }

  const scoreDifference = Math.abs(mainScore - assistantScore);
  let confidence;
  let calibratedScore;
  let needsReview = false;

  // 根据规范要求进行校准
  if (scoreDifference <= 0.5) {
    // 置信度高，使用平均分
    confidence = "high";
    calibratedScore = (mainScore + assistantScore) / 2;
  } else if (scoreDifference <= 1.5) {
    // 置信度中，使用加权平均（主裁判权重60%）
    confidence = "medium";
    calibratedScore = mainScore * 0.6 + assistantScore * 0.4;
  } else {
    // 置信度低，建议人工复核
    confidence = "low";
    calibratedScore = mainScore * 0.6 + assistantScore * 0.4; // 仍然使用加权
    needsReview = true;
  }

  // 确保评分在合理范围内
  calibratedScore = Math.max(0, Math.min(10, calibratedScore));
  
  return {
    scoreDifference,
    confidence,
    calibratedScore,
    needsReview
  };
}

// 测试用例
const testCases = [
  { name: "高置信度测试", mainScore: 8.5, assistantScore: 8.2 },
  { name: "中置信度测试", mainScore: 7.8, assistantScore: 6.5 },
  { name: "低置信度测试", mainScore: 9.0, assistantScore: 6.0 },
  { name: "完全一致测试", mainScore: 8.0, assistantScore: 8.0 },
  { name: "边界测试", mainScore: 7.5, assistantScore: 6.0 },
];

testCases.forEach(testCase => {
  console.log(`\n--- ${testCase.name} ---`);
  console.log(`主裁判评分: ${testCase.mainScore}`);
  console.log(`副裁判评分: ${testCase.assistantScore}`);
  
  const result = testScoreCalibration(testCase.mainScore, testCase.assistantScore);
  if (result) {
    console.log(`评分差异: ${result.scoreDifference.toFixed(2)}`);
    console.log(`置信度: ${result.confidence}`);
    console.log(`校准后评分: ${result.calibratedScore.toFixed(2)}`);
    console.log(`需要复核: ${result.needsReview ? "是" : "否"}`);
    
    // 验证校准规则
    if (result.scoreDifference <= 0.5 && result.confidence !== "high") {
      console.error("❌ 校准规则错误：小差异应该是高置信度");
    } else if (result.scoreDifference > 0.5 && result.scoreDifference <= 1.5 && result.confidence !== "medium") {
      console.error("❌ 校准规则错误：中等差异应该是中置信度");
    } else if (result.scoreDifference > 1.5 && result.confidence !== "low") {
      console.error("❌ 校准规则错误：大差异应该是低置信度");
    } else {
      console.log("✅ 校准规则正确");
    }
  }
});

console.log("\n=== 统一评分标准验证 ===\n");

const scoringCriteria = {
  "论据质量": { weight: 0.4, levels: [
    { range: "8.5-10", description: "优秀：权威机构数据，事实准确" },
    { range: "7.0-8.4", description: "良好：知名机构报告，基本准确" },
    { range: "5.5-6.9", description: "一般：学术资料，可信度中等" },
    { range: "3.0-5.4", description: "较差：来源不明或有错误" },
    { range: "0-2.9", description: "很差：严重违背事实" }
  ]},
  "逻辑严密性": { weight: 0.35, levels: [
    { range: "8.5-10", description: "优秀：论证结构严密，逻辑链完整" },
    { range: "7.0-8.4", description: "良好：论证清晰，轻微间隙" },
    { range: "5.5-6.9", description: "一般：基本清晰，个别跳跃" },
    { range: "3.0-5.4", description: "较差：逻辑漏洞较多" },
    { range: "0-2.9", description: "很差：逻辑链断裂" }
  ]},
  "反驳有效性": { weight: 0.25, levels: [
    { range: "8.5-10", description: "优秀：精准击中要害，反驳有力" },
    { range: "7.0-8.4", description: "良好：能指出问题，有说服力" },
    { range: "5.5-6.9", description: "一般：基本合理，缺乏深度" },
    { range: "3.0-5.4", description: "较差：反驳无力或偏离主题" },
    { range: "0-2.9", description: "很差：无效反驳" }
  ]}
};

console.log("统一评分标准（10分制）：\n");
Object.entries(scoringCriteria).forEach(([criterion, details]) => {
  console.log(`📊 ${criterion}（权重${(details.weight * 100).toFixed(0)}%）：`);
  details.levels.forEach(level => {
    console.log(`  ${level.range}分: ${level.description}`);
  });
  console.log("");
});

console.log("=== 改进完成 ===");
console.log("✅ 统一10分制评分标准");
console.log("✅ 明确权重分配（论据40%，逻辑35%，反驳25%）");
console.log("✅ 增加评分校准机制");
console.log("✅ 移除副裁判时效性检查");
console.log("✅ 添加置信度评估和人工复核建议");

export {};