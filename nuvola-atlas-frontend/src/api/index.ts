import { USE_MOCK } from "./client";
import { mockApi } from "./mock";
import { remoteApi } from "./remote";

export const api = USE_MOCK ? mockApi : remoteApi;
