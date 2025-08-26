import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { useDebateEngine, DebateConfig, DebateMessage } from "../hooks/use-debate-engine";
import { PauseIcon, PlayIcon, HomeIcon } from "lucide-react";
import { motion } from "framer-motion";

export default function DebateStage() {
  const location = useLocation();
  const navigate = useNavigate();
  const config = location.state?.config as DebateConfig;
  
  // 如果没有配置，重定向到首页
  useEffect(() => {
    if (!config) {
      navigate("/");
    }
  }, [config, navigate]);

  const { state, togglePause, startDebate } = useDebateEngine(config || {} as DebateConfig);

  // 开始辩论
  useEffect(() => {
    if (config) {
      startDebate();
    }
  }, [config, startDebate]);

  if (!config) {
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

  // 获取角色颜色
  const getRoleColor = (role: DebateMessage["role"]) => {
    switch (role) {
      case "affirmative":
        return "bg-blue-100 dark:bg-blue-900";
      case "negative":
        return "bg-red-100 dark:bg-red-900";
      case "main_referee":
        return "bg-purple-100 dark:bg-purple-900";
      case "assistant_referee":
        return "bg-green-100 dark:bg-green-900";
      default:
        return "bg-gray-100 dark:bg-gray-800";
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">辩论舞台</h1>
          <p className="text-muted-foreground">
            辩题：{config.topic}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/")}
            title="返回首页"
          >
            <HomeIcon className="h-4 w-4" />
          </Button>
          <Button
            variant={state.isPaused ? "default" : "outline"}
            size="icon"
            onClick={togglePause}
            title={state.isPaused ? "继续" : "暂停"}
          >
            {state.isPaused ? (
              <PlayIcon className="h-4 w-4" />
            ) : (
              <PauseIcon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <Card className="h-full">
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">辩论进程</h2>
                <div className="text-sm text-muted-foreground">
                  回合：{state.currentRound}/{state.totalRounds}
                </div>
              </div>
              
              <div className="space-y-4 max-h-[60vh] overflow-y-auto p-2">
                {state.messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`p-4 rounded-lg ${getRoleColor(message.role)}`}
                  >
                    <div className="font-semibold mb-2">
                      {getRoleName(message.role)}
                    </div>
                    {message.loading ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-pulse h-2 w-2 rounded-full bg-current"></div>
                        <div className="animate-pulse h-2 w-2 rounded-full bg-current delay-150"></div>
                        <div className="animate-pulse h-2 w-2 rounded-full bg-current delay-300"></div>
                        <span className="ml-2">思考中...</span>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap">{message.content}</div>
                    )}
                  </motion.div>
                ))}
                
                {state.messages.length === 0 && !state.isDebateFinished && (
                  <div className="text-center py-8 text-muted-foreground">
                    辩论即将开始...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="h-full">
            <CardContent className="p-4">
              <h2 className="text-xl font-semibold mb-4">辩论信息</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">辩题</h3>
                  <p>{config.topic}</p>
                </div>
                
                <div>
                  <h3 className="font-medium">回合数</h3>
                  <p>{config.rounds}</p>
                </div>
                
                <div>
                  <h3 className="font-medium">辩手</h3>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded">
                      <p className="font-medium">正方</p>
                      <p className="text-xs text-muted-foreground">deepseek-v3-1-250821</p>
                    </div>
                    <div className="p-2 bg-red-100 dark:bg-red-900 rounded">
                      <p className="font-medium">反方</p>
                      <p className="text-xs text-muted-foreground">kimi-k2-250711</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium">裁判</h3>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded">
                      <p className="font-medium">主裁判</p>
                      <p className="text-xs text-muted-foreground">qwen-plus</p>
                    </div>
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded">
                      <p className="font-medium">副裁判</p>
                      <p className="text-xs text-muted-foreground">doubao-seed-1-6-250615</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium">高级参数</h3>
                  <div className="text-sm space-y-1 mt-2">
                    <div className="flex justify-between">
                      <span>采样温度:</span>
                      <span>{config.temperature}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>核采样概率阈值:</span>
                      <span>{config.top_p}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>最大Token数:</span>
                      <span>{config.max_tokens}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>裁判深度思考:</span>
                      <span>{config.thinking ? "开启" : "关闭"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}