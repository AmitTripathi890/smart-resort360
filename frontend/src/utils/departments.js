export const getDepartmentNameForCategory = (category = '') => {
  const value = (category || '').toLowerCase();

  if (value.includes('food') || value.includes('beverage') || value.includes('f&b') || value.includes('milk') || value.includes('egg')) {
    return 'Food & Beverage';
  }
  if (value.includes('housekeeping') || value.includes('amenit') || value.includes('linen') || value.includes('towel') || value.includes('shampoo')) {
    return 'Housekeeping';
  }
  if (value.includes('maintenance') || value.includes('hvac') || value.includes('filter')) {
    return 'Maintenance';
  }
  if (value.includes('front desk')) {
    return 'Front Desk';
  }

  return null;
};

export const getDepartmentNameForRecommendation = (recommendation) => {
  if (recommendation.type === 'staffing') return 'Housekeeping';
  return getDepartmentNameForCategory(
    recommendation.metrics_data?.category ||
    `${recommendation.title} ${recommendation.recommended_action}`
  );
};

export const matchesDepartment = (departmentName, selectedDepartment) => (
  selectedDepartment === 'all' || departmentName === selectedDepartment
);
