import React from 'react';
import { LifestyleRecommendationsPage } from './LifestyleRecommendationsPage';

/**
 * NutritionPage acts as the canonical entry point for the Nutrition and Meal Planning engine,
 * delegating to the unified LifestyleRecommendationsPage with active Nutrition pillar.
 */
export const NutritionPage: React.FC = () => {
  return <LifestyleRecommendationsPage />;
};

export default NutritionPage;