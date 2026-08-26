import { Type } from "@google/genai";

export function mcpSchemaToGeminiSchema(mcpSchema: any) {
  if (!mcpSchema || mcpSchema.type !== 'object') {
    return {
      type: Type.OBJECT,
      properties: {}
    };
  }
  const properties: any = {};
  for (const [key, prop] of Object.entries(mcpSchema.properties || {})) {
    let type = Type.STRING;
    const propType = (prop as any).type;
    if (propType === 'string') type = Type.STRING;
    else if (propType === 'number') type = Type.NUMBER;
    else if (propType === 'integer') type = Type.INTEGER;
    else if (propType === 'boolean') type = Type.BOOLEAN;
    else if (propType === 'array') type = Type.ARRAY;
    else if (propType === 'object') type = Type.OBJECT;
    
    properties[key] = {
      type,
      description: (prop as any).description
    };
  }
  return {
    type: Type.OBJECT,
    properties,
    required: mcpSchema.required || []
  };
}
