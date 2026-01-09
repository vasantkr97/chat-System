//Global in-memory state for active conversation

export const conversationMessages: Record<string, any[]> = {} //{ conversationId: [messages]}

export const getMessages = (conversationId: string) => {
    return conversationMessages[conversationId] || []
}

export const addMessages = (conversationId: string, messages: []) => {
    if (!conversationMessages[conversationId]) {
        conversationMessages[conversationId] = []
    }
    conversationMessages[conversationId].push(messages)
}

export const clearMessages = (conversationId: string) => {
    delete conversationMessages[conversationId];
}