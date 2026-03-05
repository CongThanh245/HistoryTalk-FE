import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface RecentQuizItem {
  title: string;
  questions: number;
  score: number;
  time: string;
}

export interface SuggestedQuizItem {
  title: string;
  questions: number;
  difficulty: string;
  tag: string;
}

export const homeService = {
  getRecentQuiz: async (): Promise<RecentQuizItem[]> => {
    const res = await axios.get(`${API_URL}/quiz/history`, {
      params: { limit: 3 },
    });
    return res.data;
  },

  getSuggestedQuiz: async (): Promise<SuggestedQuizItem[]> => {
    const res = await axios.get(`${API_URL}/quiz/suggested`, {
      params: { limit: 3 },
    });
    return res.data;
  },
};