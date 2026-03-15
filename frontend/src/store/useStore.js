import { create } from "zustand";
import axios from "axios";

const useStore = create((set, get) => ({
  projects: [],
  currentProject: null,
  modelStatus: null,
  loading: false,
  error: null,
  chatOpen: false,
  chatMessages: [],

  setLoading: (v) => set({ loading: v }),
  setError: (v) => set({ error: v }),
  toggleChat: () => set((s) => ({ chatOpen: !s.chatOpen })),
  clearChat: () => set({ chatMessages: [] }),

  fetchModelStatus: async () => {
    try {
      const { data } = await axios.get("/api/model/status");
      set({ modelStatus: data });
    } catch (_) {}
  },

  fetchProjects: async () => {
    try {
      const { data } = await axios.get("/api/projects");
      set({ projects: data });
    } catch (e) { set({ error: e.message }); }
  },

  fetchProject: async (id) => {
    try {
      const { data } = await axios.get(`/api/projects/${id}`);
      set({ currentProject: data });
      return data;
    } catch (e) { set({ error: e.message }); }
  },

  saveProject: async (body) => {
    const { data } = await axios.post("/api/projects", body);
    set((s) => ({ projects: [data, ...s.projects], currentProject: data }));
    return data;
  },

  deleteProject: async (id) => {
    await axios.delete(`/api/projects/${id}`);
    set((s) => ({ projects: s.projects.filter((p) => p.id !== id) }));
  },

  updateTask: async (projectId, taskId, updates) => {
    const { data } = await axios.patch(`/api/projects/${projectId}/tasks/${taskId}`, updates);
    set({ currentProject: data });
    return data;
  },

  decomposeProject: async (form) => {
    set({ loading: true, error: null });
    try {
      const { data } = await axios.post("/api/model/decompose", form);
      set({ loading: false });
      return data;
    } catch (e) {
      set({ loading: false, error: e.response?.data?.error || e.message });
      throw e;
    }
  },

  sendChat: async (message) => {
    const { currentProject, chatMessages } = get();
    const userMsg = { role: "user", content: message, id: Date.now() };
    set((s) => ({ chatMessages: [...s.chatMessages, userMsg] }));
    try {
      const { data } = await axios.post("/api/model/chat", {
        message,
        projectContext: currentProject ? `${currentProject.projectName}: ${currentProject.summary}` : "General",
      });
      set((s) => ({ chatMessages: [...s.chatMessages, { role: "assistant", content: data.reply, source: data.source, id: Date.now() + 1 }] }));
    } catch (_) {
      set((s) => ({ chatMessages: [...s.chatMessages, { role: "assistant", content: "Sorry, I ran into an error. Please try again.", id: Date.now() + 1 }] }));
    }
  },
}));

export default useStore;
