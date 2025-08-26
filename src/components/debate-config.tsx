import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Slider } from "./ui/slider";
import { Switch } from "./ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { DebateConfig as DebateConfigType, defaultConfig } from "../hooks/use-debate-engine";

interface DebateConfigProps {
  onStartDebate: (config: DebateConfigType) => void;
}

export default function DebateConfigForm({ onStartDebate }: DebateConfigProps) {
  const [config, setConfig] = useState<DebateConfigType>({
    ...defaultConfig,
    topic: "",
  });

  const handleConfigChange = (field: keyof DebateConfigType, value: any) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!config.topic.trim()) {
      alert("请输入辩题");
      return;
    }
    onStartDebate(config);
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">辩论配置</CardTitle>
        <CardDescription>
          设置辩论主题、回合数和高级参数
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="topic">辩论主题</Label>
            <Textarea
              id="topic"
              placeholder="请输入辩题，例如：AI是否会取代人类"
              value={config.topic}
              onChange={(e) => handleConfigChange("topic", e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rounds">辩论回合数</Label>
            <div className="flex items-center gap-4">
              <Slider
                id="rounds"
                min={1}
                max={10}
                step={1}
                value={[config.rounds]}
                onValueChange={(value) => handleConfigChange("rounds", value[0])}
                className="flex-1"
              />
              <span className="w-12 text-center">{config.rounds}</span>
            </div>
          </div>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="advanced-params">
              <AccordionTrigger>高级模型参数</AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="temperature">采样温度</Label>
                    <span className="text-sm text-muted-foreground">
                      {config.temperature.toFixed(1)}
                    </span>
                  </div>
                  <Slider
                    id="temperature"
                    min={0.1}
                    max={2.0}
                    step={0.1}
                    value={[config.temperature]}
                    onValueChange={(value) => handleConfigChange("temperature", value[0])}
                  />
                  <p className="text-xs text-muted-foreground">
                    控制生成文本的随机性。较低的值使输出更确定，较高的值使输出更多样化。
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="top_p">核采样概率阈值</Label>
                    <span className="text-sm text-muted-foreground">
                      {config.top_p.toFixed(1)}
                    </span>
                  </div>
                  <Slider
                    id="top_p"
                    min={0.1}
                    max={1.0}
                    step={0.1}
                    value={[config.top_p]}
                    onValueChange={(value) => handleConfigChange("top_p", value[0])}
                  />
                  <p className="text-xs text-muted-foreground">
                    模型会考虑概率质量在top_p内的token结果。
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="max_tokens">最大Token数</Label>
                    <span className="text-sm text-muted-foreground">
                      {config.max_tokens}
                    </span>
                  </div>
                  <Slider
                    id="max_tokens"
                    min={256}
                    max={4096}
                    step={256}
                    value={[config.max_tokens]}
                    onValueChange={(value) => handleConfigChange("max_tokens", value[0])}
                  />
                  <p className="text-xs text-muted-foreground">
                    模型可以生成的最大token数量。
                  </p>
                </div>

                <div className="flex items-center justify-between space-x-2">
                  <div>
                    <Label htmlFor="thinking">裁判深度思考</Label>
                    <p className="text-xs text-muted-foreground">
                      启用后，裁判将进行更深入的分析和评判。
                    </p>
                  </div>
                  <Switch
                    id="thinking"
                    checked={config.thinking}
                    onCheckedChange={(checked) => handleConfigChange("thinking", checked)}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </form>
      </CardContent>
      <CardFooter>
        <Button type="submit" onClick={handleSubmit} className="w-full">
          开始辩论
        </Button>
      </CardFooter>
    </Card>
  );
}