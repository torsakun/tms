// # TypeScript Interfaces สำหรับ Frontend
export interface TestCaseDTO {
  id: string;
  code?: string;
  title: string;
  status?: string;
  priority?: string;
  suiteId?: string | null;
}

export interface Suite {
  id: string;
  title: string;
  children?: Suite[];
}

export const DUMMY_SUITES: Suite[] = [
  { id: "suite-login", title: "Verify log in functionality" },
  { id: "suite-reg", title: "Website - Registration" },
  { 
    id: "suite-ylg", 
    title: "Login YLG Investment", 
    children: [
      { id: "suite-ylg-health", title: "Health check" },
      { id: "suite-ylg-func", title: "Functional test" }
    ]
  },
  { id: "suite-ai", title: "Test AI" }
];

export const DUMMY_CASES: TestCaseDTO[] = [
  // Without suite
  { id: "tc-1", code: "DEMO-3", title: "Test child step", status: "Unassigned", priority: "Low", suiteId: null },
  { id: "tc-2", code: "DEMO-4", title: "Another unassigned case", status: "Active", priority: "Medium", suiteId: null },
  // Suite: Login
  { id: "tc-3", code: "AUTH-1", title: "Verify successful login", status: "Active", priority: "High", suiteId: "suite-login" },
  { id: "tc-4", code: "AUTH-2", title: "Verify invalid credentials", status: "Active", priority: "High", suiteId: "suite-login" },
  // Suite: Registration
  { id: "tc-5", code: "REG-1", title: "User can register", status: "Active", priority: "High", suiteId: "suite-reg" },
  { id: "tc-6", code: "REG-2", title: "Duplicate email validation", status: "Active", priority: "Medium", suiteId: "suite-reg" },
  // Suite: Health check
  { id: "tc-7", code: "YLG-1", title: "Ping API endpoint", status: "Active", priority: "Critical", suiteId: "suite-ylg-health" },
  // Suite: Functional build out for Test AI
  { id: "tc-8", code: "AI-1", title: "LLM response parsing", status: "Draft", priority: "Medium", suiteId: "suite-ai" },
  { id: "tc-9", code: "AI-2", title: "LLM timeout handling", status: "Review", priority: "Low", suiteId: "suite-ai" },
];
