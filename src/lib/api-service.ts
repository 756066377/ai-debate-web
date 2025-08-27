// AI辩论平台统一API服务层
// 集中处理所有AI模型的请求，包括错误处理和拦截器

import { DebateConfig } from "../hooks/use-debate-engine";

// API配置接口
export interface APIConfig {
  baseURL: string;
  apiKey: string;
  model: string;
  timeout?: number;
}

// 聊天消息接口
export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// API请求参数接口
export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
}

// API响应接口
export interface ChatCompletionResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

// API错误类
export class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public provider?: string,
    public model?: string
  ) {
    super(message);
    this.name = "APIError";
  }
}

// API服务提供商配置
export const API_PROVIDERS = {
  // 阿里云通义千问
  QWEN: {
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    apiKey: "这里填写APIKey",
    timeout: 60000,
  },
  // 字节跳动豆包
  DOUBAO: {
    baseURL: "https://ark.cn-beijing.volces.com/api/v3",
    apiKey: "这里填写APIKey", 
    timeout: 60000,
  },
} as const;

// AI模型配置
export const AI_MODELS = {
  // 正方辩手 - DeepSeek V3.1
  AFFIRMATIVE: {
    provider: "DOUBAO",
    model: "deepseek-v3-1-250821",
  },
  // 反方辩手 - Kimi K2
  NEGATIVE: {
    provider: "DOUBAO", 
    model: "kimi-k2-250711",
  },
  // 主裁判 - 通义千问Plus
  MAIN_REFEREE: {
    provider: "QWEN",
    model: "qwen-plus",
  },
  // 副裁判 - 豆包
  ASSISTANT_REFEREE: {
    provider: "DOUBAO",
    model: "doubao-seed-1-6-250615",
  },
} as const;

// 统一API客户端类
export class APIClient {
  private config: APIConfig;

  constructor(config: APIConfig) {
    this.config = config;
  }

  // 发送聊天完成请求
  async chatCompletion(
    request: ChatCompletionRequest,
    timeout?: number
  ): Promise<ChatCompletionResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeout || this.config.timeout || 30000);

    try {
      console.log(`[API] 发送请求到 ${this.config.model}:`, {
        provider: this.getProviderName(),
        model: request.model,
        messageCount: request.messages.length,
        parameters: {
          temperature: request.temperature,
          top_p: request.top_p,
          max_tokens: request.max_tokens,
        },
      });

      const response = await fetch(`${this.config.baseURL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: request.model,
          messages: request.messages,
          temperature: request.temperature || 1.0,
          top_p: request.top_p || 0.7,
          max_tokens: request.max_tokens || 1536,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[API] 请求失败:`, {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        });
        
        throw new APIError(
          `API请求失败: ${response.status} ${response.statusText}`,
          response.status,
          this.getProviderName(),
          request.model
        );
      }

      const data = await response.json();
      
      console.log(`[API] 请求成功:`, {
        provider: this.getProviderName(),
        model: request.model,
        responseLength: data.choices?.[0]?.message?.content?.length || 0,
      });

      return data;
    } catch (error: any) {
      if (error instanceof APIError) {
        throw error;
      }
      
      if (error?.name === 'AbortError') {
        console.error(`[API] 请求超时:`, {
          provider: this.getProviderName(),
          model: request.model,
          timeout: timeout || this.config.timeout,
        });
        throw new APIError(
          "请求超时",
          408,
          this.getProviderName(),
          request.model
        );
      }

      console.error(`[API] 网络错误:`, {
        provider: this.getProviderName(),
        model: request.model,
        error: error?.message || String(error),
      });
      
      throw new APIError(
        `网络请求失败: ${error?.message || String(error)}`,
        undefined,
        this.getProviderName(),
        request.model
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private getProviderName(): string {
    return Object.entries(API_PROVIDERS).find(
      ([_, config]) => config.baseURL === this.config.baseURL
    )?.[0] || "UNKNOWN";
  }
}

// AI服务管理器
export class AIServiceManager {
  private clients: Map<string, APIClient> = new Map();

  constructor() {
    this.initializeClients();
  }

  private initializeClients() {
    // 初始化阿里云通义千问客户端
    this.clients.set("QWEN", new APIClient({
      baseURL: API_PROVIDERS.QWEN.baseURL,
      apiKey: API_PROVIDERS.QWEN.apiKey,
      model: "qwen-plus",
      timeout: API_PROVIDERS.QWEN.timeout,
    }));

    // 初始化字节跳动豆包客户端
    this.clients.set("DOUBAO", new APIClient({
      baseURL: API_PROVIDERS.DOUBAO.baseURL,
      apiKey: API_PROVIDERS.DOUBAO.apiKey,
      model: "doubao-seed-1-6-250615",
      timeout: API_PROVIDERS.DOUBAO.timeout,
    }));
  }

  // 获取指定角色的API客户端
  getClient(role: keyof typeof AI_MODELS): APIClient {
    const modelConfig = AI_MODELS[role];
    const client = this.clients.get(modelConfig.provider);
    
    if (!client) {
      throw new APIError(
        `未找到${modelConfig.provider}的API客户端`,
        undefined,
        modelConfig.provider
      );
    }
    
    return client;
  }

  // 发送辩手请求
  async sendDebaterRequest(
    role: "AFFIRMATIVE" | "NEGATIVE",
    systemPrompt: string,
    userContent: string,
    config: DebateConfig
  ): Promise<string> {
    const client = this.getClient(role);
    const modelConfig = AI_MODELS[role];
    
    try {
      const response = await client.chatCompletion({
        model: modelConfig.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        temperature: config.temperature,
        top_p: config.top_p,
        max_tokens: config.max_tokens,
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error(`[AIService] ${role}请求失败:`, error);
      throw error;
    }
  }

  // 发送裁判请求
  async sendRefereeRequest(
    role: "MAIN_REFEREE" | "ASSISTANT_REFEREE",
    systemPrompt: string,
    userContent: string,
    config: DebateConfig
  ): Promise<string> {
    const client = this.getClient(role);
    const modelConfig = AI_MODELS[role];
    
    try {
      const response = await client.chatCompletion({
        model: modelConfig.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        temperature: config.temperature,
        top_p: config.top_p,
        max_tokens: config.max_tokens,
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error(`[AIService] ${role}请求失败:`, error);
      throw error;
    }
  }

  // 健康检查
  async healthCheck(): Promise<{[key: string]: boolean}> {
    const results: {[key: string]: boolean} = {};
    
    for (const [provider, client] of this.clients.entries()) {
      try {
        await client.chatCompletion({
          model: provider === "QWEN" ? "qwen-plus" : "doubao-seed-1-6-250615",
          messages: [
            { role: "system", content: "健康检查" },
            { role: "user", content: "ping" }
          ],
          max_tokens: 10,
        });
        results[provider] = true;
      } catch (error) {
        console.warn(`[AIService] ${provider} 健康检查失败:`, error);
        results[provider] = false;
      }
    }
    
    return results;
  }
}

// 导出单例实例
export const aiService = new AIServiceManager();
