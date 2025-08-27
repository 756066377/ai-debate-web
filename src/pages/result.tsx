import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { DebateState, DebateConfig, DebateMessage } from "../hooks/use-debate-engine";
import { HomeIcon, RefreshCwIcon, DownloadIcon } from "lucide-react";

export default function Result() {
  const location = useLocation();
  const navigate = useNavigate();
  const finalState = location.state?.finalState as DebateState;
  const config = location.state?.config as DebateConfig;

  // 如果没有最终状态，重定向到首页
  useEffect(() => {
    if (!finalState) {
      navigate("/");
    }
  }, [finalState, navigate]);

  if (!finalState || !config) {
    return null;
  }

  // 获取角色名称
  const getRoleName = (role: DebateMessage["role"]) => {
    switch (role) {
      case "affirmative":
        return "正方";
      case "negative":
        return "反方";
      case "main_referee":
        return "主裁判";
      case "assistant_referee":
        return "副裁判";
      default:
        return "未知";
    }
  };

  // 获取获胜方名称
  const getWinnerName = (winner: "affirmative" | "negative" | "tie" | null) => {
    switch (winner) {
      case "affirmative":
        return "正方";
      case "negative":
        return "反方";
      case "tie":
        return "平局";
      default:
        return "未决定";
    }
  };

  // 获取获胜方颜色
  const getWinnerColor = (winner: "affirmative" | "negative" | "tie" | null) => {
    switch (winner) {
      case "affirmative":
        return "text-blue-600 dark:text-blue-400";
      case "negative":
        return "text-red-600 dark:text-red-400";
      case "tie":
        return "text-yellow-600 dark:text-yellow-400";
      default:
        return "";
    }
  };

  // 导出为Markdown
  const exportToMarkdown = () => {
    // 提取辩论内容
    const affirmativeMessages = finalState.messages.filter(msg => msg.role === "affirmative");
    const negativeMessages = finalState.messages.filter(msg => msg.role === "negative");
    const mainRefereeMessages = finalState.messages.filter(msg => msg.role === "main_referee");
    const assistantRefereeMessages = finalState.messages.filter(msg => msg.role === "assistant_referee");

    // 构建Markdown内容
    let markdown = `# AI自动辩论记录\n\n`;
    markdown += `## 辩题\n\n${config.topic}\n\n`;
    markdown += `## 辩论参数\n\n`;
    markdown += `- 回合数: ${config.rounds}\n`;
    markdown += `- 采样温度: ${config.temperature}\n`;
    markdown += `- 核采样概率阈值: ${config.top_p}\n`;
    markdown += `- 最大Token数: ${config.max_tokens}\n`;
    markdown += `- 裁判深度思考: ${config.thinking ? "开启" : "关闭"}\n\n`;
    
    markdown += `## 辩论过程\n\n`;
    
    // 按回合组织辩论内容
    for (let round = 1; round <= config.rounds; round++) {
      markdown += `### 第${round}回合\n\n`;
      
      // 正方发言
      const affirmativeMsg = affirmativeMessages[round - 1];
      if (affirmativeMsg) {
        markdown += `#### 正方发言\n\n${affirmativeMsg.content}\n\n`;
      }
      
      // 反方发言
      const negativeMsg = negativeMessages[round - 1];
      if (negativeMsg) {
        markdown += `#### 反方发言\n\n${negativeMsg.content}\n\n`;
      }
    }
    
    markdown += `## 裁判评判\n\n`;
    
    // 主裁判评判
    if (mainRefereeMessages.length > 0) {
      markdown += `### 主裁判评判\n\n${mainRefereeMessages[0].content}\n\n`;
    }
    
    // 副裁判评判
    if (assistantRefereeMessages.length > 0) {
      markdown += `### 副裁判评判\n\n${assistantRefereeMessages[0].content}\n\n`;
    }
    
    markdown += `## 最终结果\n\n`;
    
    // 主裁判评分
    if (finalState.mainRefereeScores) {
      markdown += `- 主裁判评分: 正方${finalState.mainRefereeScores.affirmativeScore}分，反方${finalState.mainRefereeScores.negativeScore}分\n`;
    }
    
    // 副裁判评分
    if (finalState.assistantRefereeScores) {
      markdown += `- 副裁判评分: 正方${finalState.assistantRefereeScores.affirmativeScore}分，反方${finalState.assistantRefereeScores.negativeScore}分\n`;
    }
    
    // 添加评分校准信息
    if (finalState.scoreCalibration) {
      markdown += `- 正方总分: ${finalState.scoreCalibration.totalScores.affirmativeScore}分\n`;
      markdown += `- 反方总分: ${finalState.scoreCalibration.totalScores.negativeScore}分\n`;
      markdown += `- 分数差异: ${finalState.scoreCalibration.scoreDifference.toFixed(2)}分\n`;
    }
    
    markdown += `- 获胜方: ${getWinnerName(finalState.winner)}\n\n`;
    
    markdown += `---\n\n`;
    markdown += `生成时间: ${new Date().toLocaleString()}\n`;
    
    // 创建并下载文件
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `辩论记录-${config.topic}-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">辩论结果</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/")}
          >
            <HomeIcon className="h-4 w-4 mr-2" />
            返回首页
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/debate", { state: { config } })}
          >
            <RefreshCwIcon className="h-4 w-4 mr-2" />
            再来一局
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportToMarkdown}
          >
            <DownloadIcon className="h-4 w-4 mr-2" />
            导出为Markdown
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">辩题：{config.topic}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 主裁判评分 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">主裁判评分</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">正方得分</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {finalState.mainRefereeScores?.affirmativeScore || 0}/100
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">反方得分</span>
                    <span className="text-2xl font-bold text-red-600">
                      {finalState.mainRefereeScores?.negativeScore || 0}/100
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 副裁判评分 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">副裁判评分</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">正方得分</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {finalState.assistantRefereeScores?.affirmativeScore || 0}/100
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">反方得分</span>
                    <span className="text-2xl font-bold text-red-600">
                      {finalState.assistantRefereeScores?.negativeScore || 0}/100
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 总分统计 */}
          {finalState.scoreCalibration && (
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  🏆 总分统计
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      {finalState.scoreCalibration.totalScores.affirmativeScore}
                    </div>
                    <div className="text-sm text-muted-foreground">正方总分</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-medium text-muted-foreground">VS</div>
                    <div className="text-xs text-muted-foreground">
                      差异: {finalState.scoreCalibration.scoreDifference.toFixed(1)}分
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-600">
                      {finalState.scoreCalibration.totalScores.negativeScore}
                    </div>
                    <div className="text-sm text-muted-foreground">反方总分</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 获胜方 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">最终结果</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className={`text-4xl font-bold ${getWinnerColor(finalState.winner)}`}>
                  {getWinnerName(finalState.winner)}
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  {finalState.winner === "tie" 
                    ? "双方表现旗鼓相当" 
                    : finalState.winner 
                      ? `${getWinnerName(finalState.winner)}在本次辩论中表现更为出色` 
                      : "裁判尚未做出最终判决"}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 论据真实性验证与裁判点评 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              🔍 论据真实性验证与裁判点评
            </h3>
            
            {/* 主裁判点评 - 事实核查报告 */}
            {finalState.messages.filter(msg => msg.role === "main_referee").map((message) => (
              <Card key={message.id} className="border-purple-200 dark:border-purple-800">
                <CardHeader className="pb-2 bg-purple-50 dark:bg-purple-900/20">
                  <CardTitle className="text-md flex items-center gap-2">
                    🏛️ 主裁判 - 事实核查报告
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {message.content}
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {/* 副裁判点评 - 独立验证报告 */}
            {finalState.messages.filter(msg => msg.role === "assistant_referee").map((message) => (
              <Card key={message.id} className="border-green-200 dark:border-green-800">
                <CardHeader className="pb-2 bg-green-50 dark:bg-green-900/20">
                  <CardTitle className="text-md flex items-center gap-2">
                    🔍 副裁判 - 独立验证报告
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {message.content}
                  </div>
                </CardContent>
              </Card>
            ))}
            

          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button
            onClick={exportToMarkdown}
            className="w-full md:w-auto"
          >
            <DownloadIcon className="h-4 w-4 mr-2" />
            导出完整辩论记录
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}