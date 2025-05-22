export interface MCPError {
  code: string;
  message: string;
}

export interface MCPMessage<T = any> {
  success: boolean;
  data?: T;
  error?: MCPError;
  fromCache?: boolean;
}
