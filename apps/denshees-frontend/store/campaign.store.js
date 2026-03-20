import { create } from "zustand";

const useCampaignStore = create((set) => ({
  // Campaign data
  currentCampaign: null,

  // Leads/contacts data
  leads: [],
  totalLeads: 0,
  currentPage: 1,
  totalPages: 1,
  searchQuery: "",

  // Set current campaign
  setCurrentCampaign: (campaign) => {
    set({ currentCampaign: campaign });
  },

  // Set leads data
  setLeadsData: (data) => {
    set({
      leads: data.items || [],
      totalLeads: data.totalItems || 0,
      totalPages: data.totalPages || 1,
    });
  },

  // Set pagination
  setPage: (page) => {
    set({ currentPage: page });
  },

  // Set search query
  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  // Reset campaign store
  resetCampaignStore: () => {
    set({
      currentCampaign: null,
      leads: [],
      totalLeads: 0,
      currentPage: 1,
      totalPages: 1,
      searchQuery: "",
    });
  },
}));

export default useCampaignStore;
