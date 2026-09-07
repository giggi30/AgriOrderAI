# Implementation Plan - AgriOrder AI Gemini Integration

This plan outlines the steps to implement the AgriOrder AI conversational widget using Next.js and Google Gemini API.

## User Review Required

> [!IMPORTANT]
> A Google Gemini API Key is required. You will need to add it to a `.env.local` file as `NEXT_PUBLIC_GEMINI_API_KEY`.

## Proposed Changes

### Project Initialization
- Initialize a Next.js project using `create-next-app` with TypeScript, Tailwind CSS, and App Router.
- Install dependencies: `@google/generative-ai` and `lucide-react`.

### [Component Name] AI Integration Layer
#### [NEW] [agriOrderService.ts](file:///Users/luigiragni/Desktop/AgriOrderAI/src/lib/agriOrderService.ts)
- Implement the interface with Google Gemini SDK.
- Include the `SYSTEM_INSTRUCTION` as specified in the plan.
- Export `askAgriOrderAI` function.

### [Component Name] UI Components
#### [NEW] [AgriOrderWidget.tsx](file:///Users/luigiragni/Desktop/AgriOrderAI/src/components/AgriOrderWidget.tsx)
- Create the React component for the chat widget.
- Implement the "iPhone Dark Mode" styling using Tailwind CSS.
- Add message history, typing indicator, and quick-reply buttons.

### [Component Name] Main Page
#### [MODIFY] [page.tsx](file:///Users/luigiragni/Desktop/AgriOrderAI/src/app/page.tsx)
- Replace the default Next.js boilerplate with the `AgriOrderWidget`.

## Verification Plan

### Automated Tests
- None planned for this initial implementation, but I will ensure the code compiles and the UI renders correctly.

### Manual Verification
- Verify the UI layout matches the "WhatsApp Dark Mode" style.
- Test the Gemini API integration by sending a sample order.
- Check the quick-reply buttons functionality.
