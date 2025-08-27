import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { aiService, APIError } from "../lib/api-service";

// 辩论配置类型
export interface DebateConfig {
  topic: string;
  rounds: number;
  temperature: number;
  top_p: number;
  max_tokens: number;
  thinking: boolean;
}

// 辩论消息类型
export interface DebateMessage {
  id: string;
  role: "affirmative" | "negative" | "main_referee" | "assistant_referee";
  content: string;
  loading?: boolean;
}

// 评分详情类型
export interface ScoreDetails {
  affirmativeScore: number;  // 正方得分
  negativeScore: number;     // 反方得分
}

// 评分校准信息类型
export interface ScoreCalibration {
  mainRefereeScores: ScoreDetails;      // 主裁判评分
  assistantRefereeScores: ScoreDetails; // 副裁判评分
  totalScores: ScoreDetails;            // 总分
  scoreDifference: number;              // 两方总分差异
}

// 辩论状态类型
export interface DebateState {
  messages: DebateMessage[];
  currentRound: number;
  totalRounds: number;
  isAffirmativeTurn: boolean;
  isDebateFinished: boolean;
  isPaused: boolean;
  mainRefereeScores: ScoreDetails | null;      // 主裁判评分
  assistantRefereeScores: ScoreDetails | null; // 副裁判评分
  scoreCalibration: ScoreCalibration | null;   // 评分校准信息
  winner: "affirmative" | "negative" | "tie" | null;
  processingAction: boolean;
}

// 默认配置
export const defaultConfig: DebateConfig = {
  topic: "",
  rounds: 5,
  temperature: 1.0,
  top_p: 0.7,
  max_tokens: 1536,
  thinking: true,
};

// 评分校准机制
const calculateScoreCalibration = (
  mainScores: ScoreDetails | null,
  assistantScores: ScoreDetails | null
): ScoreCalibration | null => {
  if (!mainScores || !assistantScores) {
    return null;
  }

  // 计算总分（主裁判 + 副裁判）
  const totalScores: ScoreDetails = {
    affirmativeScore: mainScores.affirmativeScore + assistantScores.affirmativeScore,
    negativeScore: mainScores.negativeScore + assistantScores.negativeScore
  };
  
  // 计算两方总分差异
  const scoreDifference = Math.abs(totalScores.affirmativeScore - totalScores.negativeScore);
  
  console.log("评分校准结果:", {
    mainScores,
    assistantScores,
    totalScores,
    scoreDifference
  });

  return {
    mainRefereeScores: mainScores,
    assistantRefereeScores: assistantScores,
    totalScores,
    scoreDifference
  };
};

// 生成唯一ID
const generateId = () => Math.random().toString(36).substring(2, 9);

export function useDebateEngine(config: DebateConfig) {
  const navigate = useNavigate();
  const [state, setState] = useState<DebateState>({
    messages: [],
    currentRound: 0,
    totalRounds: config.rounds,
    isAffirmativeTurn: true,
    isDebateFinished: false,
    isPaused: false,
    mainRefereeScores: null,
    assistantRefereeScores: null,
    scoreCalibration: null,
    winner: null,
    processingAction: false,
  });

  // 添加消息
  const addMessage = useCallback((role: DebateMessage["role"], content: string, loading = false) => {
    setState((prev) => ({
      ...prev,
      messages: [
        ...prev.messages,
        { id: generateId(), role, content, loading },
      ],
    }));
  }, []);

  // 更新消息
  const updateMessage = useCallback((id: string, content: string, loading = false) => {
    setState((prev) => ({
      ...prev,
      messages: prev.messages.map((msg) =>
        msg.id === id ? { ...msg, content, loading } : msg
      ),
    }));
  }, []);

  // 暂停/继续辩论
  const togglePause = useCallback(() => {
    setState((prev) => ({ ...prev, isPaused: !prev.isPaused }));
  }, []);

  // 重置辩论
  const resetDebate = useCallback(() => {
    setState({
      messages: [],
      currentRound: 0,
      totalRounds: config.rounds,
      isAffirmativeTurn: true,
      isDebateFinished: false,
      isPaused: false,
      mainRefereeScores: null,
      assistantRefereeScores: null,
      scoreCalibration: null,
      winner: null,
      processingAction: false,
    });
  }, [config.rounds]);

  // 调用AI API获取回复
  const fetchAIResponse = useCallback(
    async (role: "affirmative" | "negative", previousMessages: DebateMessage[]) => {
      console.log(`开始获取${role === "affirmative" ? "正方" : "反方"}的回复`);
      
      // 添加加载中的消息
      const messageId = generateId();
      setState((prev) => ({
        ...prev,
        messages: [
          ...prev.messages,
          { id: messageId, role, content: "", loading: true },
        ],
      }));
      
      try {
        // 构建系统提示词
        const systemPrompt = `你是一位顶级辩论选手，正在参加关于"${config.topic}"的高水平辩论赛。
${role === "affirmative" ? "你代表正方，必须坚决支持该观点。" : "你代表反方，必须坚决反对该观点。"}

【核心要求：构建完整论证链条 + 提供有力说服论据】

1. **逻辑性要求**：构建完整的论证链条
   - 前提设定：明确你的基础假设和出发点
   - 推理过程：展示清晰的逻辑推理步骤
   - 结论导出：确保结论从前提和推理中自然得出
   - 体系构建：让各个论点相互支撑形成完整体系

2. **说服力要求**：论据真实有力，能动摇评委立场
   - 权威论据：引用可信的数据、研究、专家观点
   - 现实案例：使用具体生动的真实案例
   - 对比论证：展示你方观点的优势和对方观点的不足
   - 情理并重：既有理性分析又有情感共鸣

【发言结构】
- 开门见山：直接亮出核心观点
- 论证展开：按照"前提→推理→结论"的逻辑链条
- 有力支撑：每个论点都要有具体论据支撑
- 强化立场：重申观点并指出对方漏洞

严格控制在200-300字内，每句话都要有逻辑价值和说服力！`;

        // 构建用户消息
        let userContent = "";
        if (previousMessages.filter(msg => msg.role === role).length === 0) {
          // 首次发言
          userContent = `【开场立论】
辩题："${config.topic}"
你是${role === "affirmative" ? "正方" : "反方"}，请按照以下要求进行开场立论：

**逻辑性要求：**
1. 明确前提：交代你的基础假设和判断标准
2. 推理链条：展示从前提到结论的完整推理过程
3. 逻辑严密：确保每个推理步骤都站得住脚

**说服力要求：**
1. 权威数据：提供具体的数字、统计数据或研究结果
2. 现实案例：使用可信的真实案例或事件
3. 情理并重：既要理性分析也要能引起情感共鸣`;
        } else {
          // 提取对方最近的发言
          const opponentMessages = previousMessages.filter(
            (msg) => msg.role === (role === "affirmative" ? "negative" : "affirmative")
          );
          const lastOpponentMessage = opponentMessages[opponentMessages.length - 1];
          
          userContent = `【反驳回合】
对方刚才的发言：
"${lastOpponentMessage?.content || "对方尚未发言"}"

请按照以下策略进行犀利反驳：

**逻辑性攻击：**
1. 识别漏洞：精准指出对方论证链条中的逻辑漏洞
2. 拆解论证：逐一反驳对方的前提、推理和结论
3. 重构逻辑：提供更强的论证链条来支撑你方观点

**说服力攻击：**
1. 事实核查：指出对方论据的不准确或过时之处
2. 权威对比：提供更权威、更新的数据和案例
3. 反向论证：用对方的逻辑来证明你方观点的正确性`;
        }

        // 使用统一API服务发送请求
        console.log(`[辩论引擎] ${role === "affirmative" ? "正方" : "反方"}请求参数:`, {
          temperature: config.temperature,
          top_p: config.top_p,
          max_tokens: config.max_tokens,
          thinking: config.thinking,
        });
        
        const aiRole = role === "affirmative" ? "AFFIRMATIVE" : "NEGATIVE";
        const aiResponse = await aiService.sendDebaterRequest(
          aiRole,
          systemPrompt,
          userContent,
          config
        );

        // 更新消息
        setState((prev) => ({
          ...prev,
          messages: prev.messages.map((msg) =>
            msg.id === messageId ? { ...msg, content: aiResponse, loading: false } : msg
          ),
        }));
        
        return aiResponse;
      } catch (error) {
        console.error(`获取${role === "affirmative" ? "正方" : "反方"}回复时出错:`, error);
        
        // 根据错误类型显示不同的错误信息
        let errorMessage = "AI回复获取失败，请重试。";
        if (error instanceof APIError) {
          errorMessage = `${error.provider || ''}模型请求失败: ${error.message}`;
        }
        
        setState((prev) => ({
          ...prev,
          messages: prev.messages.map((msg) =>
            msg.id === messageId ? { ...msg, content: errorMessage, loading: false } : msg
          ),
        }));
        return null;
      }
    },
    [config]
  );

  // 调用主裁判API
  const fetchMainRefereeResponse = useCallback(
    async (messages: DebateMessage[]) => {
      const messageId = generateId();
      setState(prev => ({
        ...prev,
        messages: [
          ...prev.messages,
          { id: messageId, role: "main_referee", content: "", loading: true },
        ],
      }));
      
      try {
        const affirmativeMessages = messages.filter(msg => msg.role === "affirmative");
        const negativeMessages = messages.filter(msg => msg.role === "negative");
        
        const systemPrompt = `你是专业辩论主裁判，以理性客观态度评判"${config.topic}"辩论。

【评判原则】
- 基于事实和逻辑，杜绝情感干扰
- 标准化评分，确保公正一致
- 客观分析论证过程，非立场偏好
- 专注技巧质量，避免主观偏见

【统一量化评分标准（满分100分）】
1. **逻辑性（70分）**：论证链条完整性
   - 前提清晰度（0-20分）：基础假设表达明确程度
   - 推理严密性（0-30分）：逻辑推导规范程度
   - 结论合理性（0-20分）：结论必然性程度

2. **说服力（30分）**：论据客观有效性
   - 证据权威性（0-15分）：数据来源可信度和时效性
   - 论据相关性（0-10分）：证据与论点直接关联度
   - 反驳有效性（0-5分）：对对方观点针对性回应程度

【输出要求】
- 分析简洁精准，直击核心问题
- 避免废话和重复表述
- 每项评估不超过15字
- 基于统一标准给出明确分数

输出格式：
## 📊 主裁判评分
### 正方分析
**逻辑性：**
- 前提清晰度：XX/20分 [核心问题描述]
- 推理严密性：XX/30分 [核心问题描述]
- 结论合理性：XX/20分 [核心问题描述]

**说服力：**
- 证据权威性：XX/15分 [核心问题描述]
- 论据相关性：XX/10分 [核心问题描述]
- 反驳有效性：XX/5分 [核心问题描述]
- **正方得分：XX/100分**

### 反方分析
**逻辑性：**
- 前提清晰度：XX/20分 [核心问题描述]
- 推理严密性：XX/30分 [核心问题描述]
- 结论合理性：XX/20分 [核心问题描述]

**说服力：**
- 证据权威性：XX/15分 [核心问题描述]
- 论据相关性：XX/10分 [核心问题描述]
- 反驳有效性：XX/5分 [核心问题描述]
- **反方得分：XX/100分**

## 🏆 主裁判裁决
**获胜方：正方/反方/平局**
**核心依据：** [一句话说明关键差异]`;

        const userContent = `辩题：${config.topic}

正方发言：
${affirmativeMessages.map(msg => msg.content).join("\n\n")}

反方发言：
${negativeMessages.map(msg => msg.content).join("\n\n")}`;

        // 使用统一API服务发送请求
        console.log(`[辩论引擎] 主裁判请求参数:`, {
          temperature: config.temperature,
          top_p: config.top_p,
          max_tokens: config.max_tokens,
          thinking: config.thinking,
        });
        
        const aiResponse = await aiService.sendRefereeRequest(
          "MAIN_REFEREE",
          systemPrompt,
          userContent,
          config
        );

        // 解析评分（100分制）
        let affirmativeScore = 70.0;
        let negativeScore = 70.0;
        let winner: "affirmative" | "negative" | "tie" | null = null;
        
        const affMatch = aiResponse.match(/正方得分[：:]\s*(\d{1,3}(?:\.\d+)?)/)
        const negMatch = aiResponse.match(/反方得分[：:]\s*(\d{1,3}(?:\.\d+)?)/)
        
        if (affMatch) {
          affirmativeScore = parseFloat(affMatch[1]);
          // 验证100分制评分范围
          if (affirmativeScore > 100 || affirmativeScore < 0) {
            console.warn(`[主裁判] 正方得分异常 ${affirmativeScore}，使用默认值 70.0`);
            affirmativeScore = 70.0;
          }
        }
        if (negMatch) {
          negativeScore = parseFloat(negMatch[1]);
          // 验证100分制评分范围
          if (negativeScore > 100 || negativeScore < 0) {
            console.warn(`[主裁判] 反方得分异常 ${negativeScore}，使用默认值 70.0`);
            negativeScore = 70.0;
          }
        }
        
        if (aiResponse.includes("获胜方：正方")) winner = "affirmative";
        else if (aiResponse.includes("获胜方：反方")) winner = "negative";
        else if (aiResponse.includes("获胜方：平局")) winner = "tie";
        else {
          if (affirmativeScore > negativeScore) winner = "affirmative";
          else if (negativeScore > affirmativeScore) winner = "negative";
          else winner = "tie";
        }

        const mainScores: ScoreDetails = { affirmativeScore, negativeScore };
        
        setState(prev => ({
          ...prev,
          messages: prev.messages.map((msg) =>
            msg.id === messageId ? { ...msg, content: aiResponse, loading: false } : msg
          ),
          mainRefereeScores: mainScores,
          winner: winner || prev.winner,
        }));
        
        return { response: aiResponse, scores: mainScores, winner };
      } catch (error) {
        console.error("主裁判评分出错:", error);
        
        // 根据错误类型显示不同的错误信息
        let errorMessage = "主裁判评分获取失败";
        if (error instanceof APIError) {
          errorMessage = `主裁判${error.provider || ''}模型请求失败: ${error.message}`;
        }
        
        setState(prev => ({
          ...prev,
          messages: prev.messages.map((msg) =>
            msg.id === messageId ? { ...msg, content: errorMessage, loading: false } : msg
          ),
        }));
        return null;
      }
    },
    [config]
  );

  // 调用副裁判API
  const fetchAssistantRefereeResponse = useCallback(
    async (messages: DebateMessage[]) => {
      const messageId = generateId();
      setState(prev => ({
        ...prev,
        messages: [
          ...prev.messages,
          { id: messageId, role: "assistant_referee", content: "", loading: true },
        ],
      }));
      
      try {
        const affirmativeMessages = messages.filter(msg => msg.role === "affirmative");
        const negativeMessages = messages.filter(msg => msg.role === "negative");
        
        const systemPrompt = `你是专业辩论副裁判，以绝对理性客观态度独立评判"${config.topic}"辩论。

【独立评判原则】
- 保持绝对中立，不受外部意见影响
- 使用统一评分标准，形成交叉验证
- 基于可衡量指标，避免主观猜测
- 技术性评估，非情感认同

【统一量化评分标准（满分100分）】
1. **逻辑性（70分）**：论证链条完整性
   - 前提清晰度（0-20分）：基础假设表达明确程度
   - 推理严密性（0-30分）：逻辑推导规范程度
   - 结论合理性（0-20分）：结论必然性程度

2. **说服力（30分）**：论据客观有效性
   - 证据权威性（0-15分）：数据来源可信度和时效性
   - 论据相关性（0-10分）：证据与论点直接关联度
   - 反驳有效性（0-5分）：对对方观点针对性回应程度

【输出要求】
- 独立分析，简洁锐利，不超过15字
- 不参考主裁判，完全独立判断
- 使用统一标准，直击核心问题
- 基于标准化评分给出明确分数

输出格式：
## 📊 副裁判独立评分
### 正方技术分析
**逻辑性：**
- 前提清晰度：XX/20分 [核心问题描述]
- 推理严密性：XX/30分 [核心问题描述]
- 结论合理性：XX/20分 [核心问题描述]

**说服力：**
- 证据权威性：XX/15分 [核心问题描述]
- 论据相关性：XX/10分 [核心问题描述]
- 反驳有效性：XX/5分 [核心问题描述]
- **正方得分：XX/100分**

### 反方技术分析
**逻辑性：**
- 前提清晰度：XX/20分 [核心问题描述]
- 推理严密性：XX/30分 [核心问题描述]
- 结论合理性：XX/20分 [核心问题描述]

**说服力：**
- 证据权威性：XX/15分 [核心问题描述]
- 论据相关性：XX/10分 [核心问题描述]
- 反驳有效性：XX/5分 [核心问题描述]
- **反方得分：XX/100分**

## 🏆 副裁判独立裁决
**推荐获胜方：正方/反方/平局**
**独立依据：** [一句话说明关键差异]`;

        const userContent = `辩题：${config.topic}

正方发言：
${affirmativeMessages.map(msg => msg.content).join("\n\n")}

反方发言：
${negativeMessages.map(msg => msg.content).join("\n\n")}`;

        // 使用统一API服务发送请求
        console.log(`[辩论引擎] 副裁判请求参数:`, {
          temperature: config.temperature,
          top_p: config.top_p,
          max_tokens: config.max_tokens,
          thinking: config.thinking,
        });
        
        const aiResponse = await aiService.sendRefereeRequest(
          "ASSISTANT_REFEREE",
          systemPrompt,
          userContent,
          config
        );

        // 解析评分（100分制）
        let affirmativeScore = 70.0;
        let negativeScore = 70.0;
        let winner: "affirmative" | "negative" | "tie" | null = null;
        
        const affMatch = aiResponse.match(/正方得分[：:]\s*(\d{1,3}(?:\.\d+)?)/)
        const negMatch = aiResponse.match(/反方得分[：:]\s*(\d{1,3}(?:\.\d+)?)/)
        
        if (affMatch) {
          affirmativeScore = parseFloat(affMatch[1]);
          // 验证100分制评分范围
          if (affirmativeScore > 100 || affirmativeScore < 0) {
            console.warn(`[副裁判] 正方得分异常 ${affirmativeScore}，使用默认值 70.0`);
            affirmativeScore = 70.0;
          }
        }
        if (negMatch) {
          negativeScore = parseFloat(negMatch[1]);
          // 验证100分制评分范围
          if (negativeScore > 100 || negativeScore < 0) {
            console.warn(`[副裁判] 反方得分异常 ${negativeScore}，使用默认值 70.0`);
            negativeScore = 70.0;
          }
        }
        
        if (aiResponse.includes("推荐获胜方：正方")) winner = "affirmative";
        else if (aiResponse.includes("推荐获胜方：反方")) winner = "negative";
        else if (aiResponse.includes("推荐获胜方：平局")) winner = "tie";
        else {
          if (affirmativeScore > negativeScore) winner = "affirmative";
          else if (negativeScore > affirmativeScore) winner = "negative";
          else winner = "tie";
        }

        const assistantScores: ScoreDetails = { affirmativeScore, negativeScore };
        
        setState(prev => ({
          ...prev,
          messages: prev.messages.map((msg) =>
            msg.id === messageId ? { ...msg, content: aiResponse, loading: false } : msg
          ),
          assistantRefereeScores: assistantScores,
          winner: winner || prev.winner,
        }));
        
        return { response: aiResponse, scores: assistantScores, winner };
      } catch (error) {
        console.error("副裁判评分出错:", error);
        
        // 根据错误类型显示不同的错误信息
        let errorMessage = "副裁判评分获取失败";
        if (error instanceof APIError) {
          errorMessage = `副裁判${error.provider || ''}模型请求失败: ${error.message}`;
        }
        
        setState(prev => ({
          ...prev,
          messages: prev.messages.map((msg) =>
            msg.id === messageId ? { ...msg, content: errorMessage, loading: false } : msg
          ),
        }));
        return null;
      }
    },
    [config]
  );

  // 开始辩论
  const startDebate = useCallback(() => {
    resetDebate();
    setState(prev => ({ ...prev, currentRound: 1 }));
  }, [resetDebate]);

  // 手动执行下一步辩论
  const runNextStep = useCallback(async () => {
    if (state.processingAction || state.isDebateFinished || state.isPaused) {
      return;
    }

    setState(prev => ({ ...prev, processingAction: true }));

    try {
      if (state.isAffirmativeTurn) {
        await fetchAIResponse("affirmative", state.messages);
        setState(prev => ({ 
          ...prev, 
          isAffirmativeTurn: false,
          processingAction: false
        }));
      } else {
        await fetchAIResponse("negative", state.messages);
        setState(prev => ({ 
          ...prev, 
          isAffirmativeTurn: true,
          currentRound: prev.currentRound + 1,
          processingAction: false
        }));
      }
    } catch (error) {
      setState(prev => ({ ...prev, processingAction: false }));
    }
  }, [
    state.currentRound,
    state.isAffirmativeTurn,
    state.isDebateFinished,
    state.isPaused,
    state.processingAction,
    state.messages,
    fetchAIResponse
  ]);

  // 辩论流程控制
  useEffect(() => {
    const runDebate = async () => {
      if (state.currentRound > 0 && !state.processingAction && !state.isPaused && !state.isDebateFinished) {
        if (state.currentRound > state.totalRounds) {
          setState(prev => ({ ...prev, processingAction: true }));
          
          try {
            await fetchMainRefereeResponse(state.messages);
            await fetchAssistantRefereeResponse(state.messages);
            
            setState(prev => ({ 
              ...prev, 
              isDebateFinished: true,
              processingAction: false
            }));
          } catch (error) {
            setState(prev => ({ ...prev, processingAction: false }));
          }
        } else {
          await runNextStep();
        }
      }
    };
    
    runDebate();
  }, [
    state.currentRound,
    state.isAffirmativeTurn,
    state.processingAction,
    state.isPaused,
    state.isDebateFinished,
    state.totalRounds,
    state.messages,
    runNextStep,
    fetchMainRefereeResponse,
    fetchAssistantRefereeResponse
  ]);

  // 监听裁判评分完成状态
  useEffect(() => {
    if (state.isDebateFinished && !state.processingAction) {
      const mainRefereeMessages = state.messages.filter(msg => msg.role === "main_referee");
      const assistantRefereeMessages = state.messages.filter(msg => msg.role === "assistant_referee");
      
      const mainRefereeCompleted = mainRefereeMessages.length > 0 && !mainRefereeMessages.some(msg => msg.loading);
      const assistantRefereeCompleted = assistantRefereeMessages.length > 0 && !assistantRefereeMessages.some(msg => msg.loading);
      
      if (mainRefereeCompleted && assistantRefereeCompleted) {
        const calibration = calculateScoreCalibration(state.mainRefereeScores, state.assistantRefereeScores);
        
        let finalWinner: "affirmative" | "negative" | "tie" | null = null;
        if (calibration) {
          const { affirmativeScore, negativeScore } = calibration.totalScores;
          if (affirmativeScore > negativeScore) {
            finalWinner = "affirmative";
          } else if (negativeScore > affirmativeScore) {
            finalWinner = "negative";
          } else {
            finalWinner = "tie";
          }
        }
        
        setState(prev => ({
          ...prev,
          scoreCalibration: calibration,
          winner: finalWinner
        }));
        
        setTimeout(() => {
          navigate("/result", { 
            state: { 
              finalState: {
                ...state,
                scoreCalibration: calibration,
                winner: finalWinner
              }, 
              config 
            } 
          });
        }, 500);
      }
    }
  }, [
    state.isDebateFinished,
    state.processingAction,
    state.messages,
    state.mainRefereeScores,
    state.assistantRefereeScores,
    navigate,
    config
  ]);

  return {
    state,
    togglePause,
    startDebate,
    resetDebate,
    runNextStep,
  };
}