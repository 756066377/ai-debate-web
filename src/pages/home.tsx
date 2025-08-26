import { useNavigate } from "react-router-dom";
import DebateConfigForm from "../components/debate-config";
import { DebateConfig as DebateConfigType } from "../hooks/use-debate-engine";

export default function Home() {
  const navigate = useNavigate();

  const handleStartDebate = (config: DebateConfigType) => {
    navigate("/debate", { state: { config } });
  };

  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-8">
      <div className="text-center max-w-2xl">
        <h1 className="text-4xl font-bold mb-4">AI自动辩论软件</h1>
        <p className="text-lg text-muted-foreground">
          体验由AI驱动的智能辩论，包含主裁判和副裁判双重评判机制
        </p>
      </div>

      <DebateConfigForm onStartDebate={handleStartDebate} />
      
      <div className="text-center max-w-2xl mt-8">
        <h2 className="text-xl font-semibold mb-2">关于本软件</h2>
        <p className="text-muted-foreground">
          本软件使用先进的大语言模型技术，模拟真实的辩论场景。正方使用deepseek-v3-1-250821模型，
          反方使用kimi-k2-250711模型，主裁判使用阿里云通义千问qwen-plus模型，
          副裁判使用doubao-seed-1-6-250615模型，共同提供专业、公正的辩论体验。
        </p>
      </div>
    </div>
  );
}